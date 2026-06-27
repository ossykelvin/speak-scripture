const DEFAULT_BADGE_THRESHOLDS = [1, 10, 25, 50, 100, 250];

function readString(name: keyof ImportMetaEnv, fallback = ""): string {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readBoolean(name: keyof ImportMetaEnv, fallback: boolean): boolean {
  const value = readString(name);
  if (!value) return fallback;
  return value.toLowerCase() === "true";
}

export function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseBadgeThresholds(value?: string): number[] {
  if (!value) return DEFAULT_BADGE_THRESHOLDS;

  const thresholds = value
    .split(",")
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isInteger(item) && item > 0);

  const uniqueSorted = [...new Set(thresholds)].sort((a, b) => a - b);
  return uniqueSorted.length === DEFAULT_BADGE_THRESHOLDS.length
    ? uniqueSorted
    : DEFAULT_BADGE_THRESHOLDS;
}

export const appConfig = {
  appName: readString("VITE_APP_NAME", "Speak Scripture"),
  appVersion: readString("VITE_APP_VERSION", "1.1.0"),
  appUrl: readString(
    "VITE_APP_URL",
    typeof window === "undefined" ? "http://localhost:8080" : window.location.origin,
  ),
  bibleApiBaseUrl: readString("VITE_BIBLE_API_BASE_URL").replace(/\/+$/, ""),
  helloAoBibleApiBaseUrl: readString(
    "VITE_HELLOAO_BIBLE_API_BASE_URL",
    readString("VITE_BIBLE_API_BASE_URL", "https://bible.helloao.org"),
  ).replace(/\/+$/, ""),
  legacyBibleApiBaseUrl: readString("VITE_LEGACY_BIBLE_API_BASE_URL", "https://bible-api.com").replace(/\/+$/, ""),
  defaultBibleTranslation: readString("VITE_DEFAULT_BIBLE_TRANSLATION", "eng_kjv"),
  legacyBibleTranslation: readString("VITE_LEGACY_BIBLE_TRANSLATION", "kjv"),
  analyticsEnabled: readBoolean("VITE_ANALYTICS_ENABLED", true),
  badgeThresholds: parseBadgeThresholds(readString("VITE_BADGE_THRESHOLDS")),
  storageProvider: readString("VITE_STORAGE_PROVIDER", "localStorage"),
  referenceFunctionName: readString("VITE_REFERENCE_FUNCTION_NAME", "extract-references"),
  historySyncFunctionName: readString("VITE_HISTORY_SYNC_FUNCTION_NAME", "sync-history"),
  requestTimeoutMs: parsePositiveInteger(readString("VITE_REQUEST_TIMEOUT_MS"), 15_000),
  supabase: {
    url: readString("VITE_SUPABASE_URL"),
    publishableKey: readString("VITE_SUPABASE_PUBLISHABLE_KEY"),
    projectId: readString("VITE_SUPABASE_PROJECT_ID"),
  },
} as const;

export function assertPublicConfig(): void {
  const missing: string[] = [];
  if (!appConfig.bibleApiBaseUrl) missing.push("VITE_BIBLE_API_BASE_URL");
  if (!appConfig.supabase.url) missing.push("VITE_SUPABASE_URL");
  if (!appConfig.supabase.publishableKey) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
