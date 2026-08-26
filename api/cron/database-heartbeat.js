import { timingSafeEqual } from "node:crypto";

function isAuthorized(request, secret) {
  const actual = Buffer.from(String(request.headers.authorization || ""));
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed" });
  const secret = String(process.env.CRON_SECRET || "");
  if (!secret) return response.status(503).json({ error: "Cron is not configured" });
  if (!isAuthorized(request, secret)) return response.status(401).json({ error: "Unauthorized" });

  const url = String(process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "");
  if (!url || !key) return response.status(503).json({ error: "Database is not configured" });

  const headers = { apikey: key, "Accept-Profile": "scripture" };
  if (!key.startsWith("sb_publishable_")) headers.Authorization = `Bearer ${key}`;

  try {
    const result = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, { headers });
    if (!result.ok) throw new Error(`Supabase returned ${result.status}`);
    return response.status(200).json({ ok: true, database: "reachable" });
  } catch (error) {
    console.error("[database-heartbeat]", error?.message || error);
    return response.status(503).json({ error: "Database heartbeat failed" });
  }
}
