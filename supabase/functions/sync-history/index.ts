import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
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

type SyncHistoryEntry = {
  id?: unknown;
  searched_at?: unknown;
  duration?: unknown;
  scripture_references?: unknown;
  failed_searches?: unknown;
  source?: unknown;
  query?: unknown;
};

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeEntry(entry: SyncHistoryEntry, userId: string) {
  if (typeof entry.id !== "string" || !entry.id) throw new Error("entry.id is required");
  if (typeof entry.searched_at !== "string" || Number.isNaN(new Date(entry.searched_at).getTime())) {
    throw new Error("entry.searched_at must be a valid ISO date");
  }
  if (!Array.isArray(entry.scripture_references)) {
    throw new Error("entry.scripture_references must be an array");
  }

  const duration = Number(entry.duration ?? 0);
  const failedSearches = Number(entry.failed_searches ?? 0);
  const source = entry.source === "microphone" || entry.source === "manual" ? entry.source : null;

  return {
    id: entry.id,
    user_id: userId,
    searched_at: entry.searched_at,
    duration: Number.isFinite(duration) && duration >= 0 ? Math.trunc(duration) : 0,
    scripture_references: entry.scripture_references,
    failed_searches: Number.isFinite(failedSearches) && failedSearches >= 0 ? Math.trunc(failedSearches) : 0,
    source,
    query: typeof entry.query === "string" ? entry.query : null,
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "POST is required" }, 405, corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Supabase function environment is not configured");
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return jsonResponse({ error: "Authentication is required" }, 401, corsHeaders);

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData.user) {
      return jsonResponse({ error: "Invalid authentication token" }, 401, corsHeaders);
    }

    const { entries } = await req.json();
    if (!Array.isArray(entries) || entries.length === 0) {
      return jsonResponse({ error: "entries must be a non-empty array" }, 400, corsHeaders);
    }

    const userId = userData.user.id;
    const normalizedEntries = entries.map((entry) => normalizeEntry(entry, userId));

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      db: { schema: "scripture" },
    }).schema("scripture");
    const { error: upsertError } = await adminClient
      .from("search_history")
      .upsert(normalizedEntries, { onConflict: "id" });

    if (upsertError) throw upsertError;

    const { count, error: countError } = await adminClient
      .from("search_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) throw countError;

    const syncedAt = new Date().toISOString();
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        user_id: userId,
        history_entry_count: count ?? normalizedEntries.length,
        last_history_sync_at: syncedAt,
      }, { onConflict: "user_id" });

    if (profileError) throw profileError;

    return jsonResponse({
      synced: normalizedEntries.length,
      historyEntryCount: count ?? normalizedEntries.length,
      syncedAt,
    }, 200, corsHeaders);
  } catch (error) {
    console.error("sync-history error:", error);
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unable to sync history",
    }, 500, corsHeaders);
  }
});
