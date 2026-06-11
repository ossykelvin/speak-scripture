/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_BIBLE_API_BASE_URL?: string;
  readonly VITE_DEFAULT_BIBLE_TRANSLATION?: string;
  readonly VITE_ANALYTICS_ENABLED?: string;
  readonly VITE_BADGE_THRESHOLDS?: string;
  readonly VITE_STORAGE_PROVIDER?: string;
  readonly VITE_REFERENCE_FUNCTION_NAME?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
