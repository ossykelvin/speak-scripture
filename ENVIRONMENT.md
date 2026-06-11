# Environment Configuration

Copy `.env.example` to `.env.local` for local development. Add the same public `VITE_*` values to Vercel for Preview and Production. Never place private provider secrets in a `VITE_*` variable because Vite embeds those values in browser JavaScript.

## Browser Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_APP_NAME` | No | Display name. Defaults to `Speak Scripture`. |
| `VITE_APP_URL` | Recommended | Canonical local or deployed URL. |
| `VITE_BIBLE_API_BASE_URL` | Yes | Bible API origin used for public verse lookup requests. |
| `VITE_DEFAULT_BIBLE_TRANSLATION` | No | Translation code used for verse lookup. Defaults to `kjv`. |
| `VITE_ANALYTICS_ENABLED` | No | Shows or hides the analytics navigation action. |
| `VITE_BADGE_THRESHOLDS` | No | Six ascending comma-separated positive integers. |
| `VITE_STORAGE_PROVIDER` | No | Documents the active history provider. Currently only `localStorage` is implemented. |
| `VITE_REFERENCE_FUNCTION_NAME` | No | Supabase Edge Function name. Defaults to `extract-references`. |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/publishable browser key. |
| `VITE_SUPABASE_PROJECT_ID` | Recommended | Project identifier used by tooling and documentation. |

Example badge thresholds:

```env
VITE_BADGE_THRESHOLDS="1,10,25,50,100,250"
```

## Edge Function Secrets

Set these in Supabase, not Vercel browser variables:

```bash
npx supabase secrets set LOVABLE_API_KEY="..."
npx supabase secrets set AI_GATEWAY_URL="https://ai.gateway.lovable.dev/v1/chat/completions"
npx supabase secrets set AI_MODEL="google/gemini-2.5-flash"
npx supabase secrets set ALLOWED_ORIGIN="https://your-domain.example"
```

`ALLOWED_ORIGIN="*"` is acceptable for local testing but a production domain is preferred.

When migrating between Supabase projects before a new provider key is available, the Edge
Function can temporarily forward extraction requests to the previous function:

```bash
npx supabase secrets set UPSTREAM_REFERENCE_FUNCTION_URL="https://old-project.supabase.co/functions/v1/extract-references"
npx supabase secrets set UPSTREAM_REFERENCE_FUNCTION_ANON_KEY="old-project-anon-key"
```

Remove both fallback values after configuring `LOVABLE_API_KEY`.

## Capacitor Build Values

Optional shell variables:

| Variable | Default |
| --- | --- |
| `CAPACITOR_APP_ID` | `com.koptechnology.speakscripture` |
| `CAPACITOR_APP_NAME` | `Speak Scripture` |
