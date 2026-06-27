import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? Deno.env.get("ALLOWED_ORIGIN") ?? "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function getCorsHeaders(req: Request) {
  const requestOrigin = req.headers.get("origin");
  const allowAll = allowedOrigins.includes("*");
  const isLocalApp = requestOrigin
    ? /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin)
      || requestOrigin === "capacitor://localhost"
    : false;
  const allowedOrigin = allowAll || isLocalApp || (requestOrigin && allowedOrigins.includes(requestOrigin))
    ? requestOrigin ?? "*"
    : "null";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  const response = await fetch(url, options);
  if (response.status === 429 && retries > 0) {
    const jitter = Math.random() * 1000;
    await new Promise(r => setTimeout(r, delay + jitter));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
  return response;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstreamUrl = Deno.env.get("UPSTREAM_REFERENCE_FUNCTION_URL");
    const upstreamAnonKey = Deno.env.get("UPSTREAM_REFERENCE_FUNCTION_ANON_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY && upstreamUrl && upstreamAnonKey) {
      const upstreamResponse = await fetchWithRetry(upstreamUrl, {
        method: "POST",
        headers: {
          apikey: upstreamAnonKey,
          Authorization: `Bearer ${upstreamAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!upstreamResponse.ok) {
        throw new Error(`Upstream reference extraction failed with status ${upstreamResponse.status}`);
      }

      return new Response(await upstreamResponse.text(), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) {
      throw new Error(
        "Configure LOVABLE_API_KEY or the UPSTREAM_REFERENCE_FUNCTION_URL and UPSTREAM_REFERENCE_FUNCTION_ANON_KEY fallback",
      );
    }
    const aiGatewayUrl = Deno.env.get("AI_GATEWAY_URL");
    const aiModel = Deno.env.get("AI_MODEL");
    if (!aiGatewayUrl) throw new Error("AI_GATEWAY_URL is not configured");
    if (!aiModel) throw new Error("AI_MODEL is not configured");

    const response = await fetchWithRetry(aiGatewayUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          {
            role: "system",
            content: `You are a Bible reference extractor. Given spoken text from a discussion, identify ALL Bible references — both explicit references (e.g., "John 3:16", "Psalm 23") AND well-known Bible quotes or paraphrases (e.g., "the Lord is my shepherd" → Psalm 23:1, "for God so loved the world" → John 3:16, "do this in remembrance of me" → Luke 22:19). You MUST recognize famous Bible verses even when the speaker does not say the chapter and verse number. Return them as a JSON array. Each item should have "book", "chapter", "verseStart", "verseEnd" (null if single verse), and "raw" (the original text as spoken). If no references found, return an empty array. Only return the JSON array, nothing else.`
          },
          { role: "user", content: text }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_references",
              description: "Extract Bible references from discussion text",
              parameters: {
                type: "object",
                properties: {
                  references: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        book: { type: "string", description: "Book name e.g. John, Genesis" },
                        chapter: { type: "number" },
                        verseStart: { type: "number" },
                        verseEnd: { type: "number", description: "null if single verse" },
                        raw: { type: "string", description: "Original reference as mentioned" }
                      },
                      required: ["book", "chapter", "verseStart", "raw"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["references"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_references" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ references: [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let references = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        references = parsed.references || [];
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    return new Response(JSON.stringify({ references }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
