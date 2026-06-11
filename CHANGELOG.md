# Changelog

## 2026-06-11

### design(branding): replace Lovable icon assets

- Added a custom Speak Scripture open-Bible and sound-wave app mark.
- Replaced the browser favicon, Apple touch icon, PWA icons, and Android launcher/adaptive icon assets.
- Updated web manifest and browser theme colors to match the new deep-navy brand.

### build(android): publish downloadable APK artifacts

- Added a GitHub Actions workflow that builds the current web bundle and Android debug APK.
- Publishes `Speak-Scripture-debug.apk` as a downloadable workflow artifact for 30 days.

### fix(supabase): support controlled project migration

- Added an optional upstream Edge Function fallback when the private AI provider key cannot be migrated.
- Kept the fallback server-side and environment-configured so browser code contains no provider credentials.

### feat(config): centralize runtime configuration

- Added typed public environment parsing in `src/config`.
- Added `.env.example` and moved local project values to ignored `.env.local`.
- Made Bible API, translation, analytics, badges, storage label, function name, and Supabase settings configurable.
- Moved AI gateway URL/model/CORS origin to server-side Supabase secrets.

### feat(search): improve scripture detection workflow

- Added reference normalization, duplicate removal, and verse lookup errors.
- Added always-available manual text input.
- Added microphone permission and unsupported-browser guidance.
- Added native Capacitor speech recognition for Android.
- Added explicit loading, empty, success, and failure states.

### feat(analytics): make badge and reporting data configurable

- Added configurable six-level badge thresholds.
- Added current badge, next badge, and progress display.
- Added successful/no-match counts and recent searches.
- Extended local history with source and failed-search metadata.

### build(vercel): prepare SPA deployment

- Added Vercel build/output settings and deep-link rewrites.
- Replaced Lovable preview metadata with Speak Scripture metadata and a web manifest.
- Documented Vercel and Supabase deployment.

### build(android): add Capacitor Android project

- Replaced remote server packaging with bundled `dist` assets.
- Added Android platform, mobile npm scripts, native speech plugin, and package ID placeholder.
- Documented debug APK, signed release/AAB, permissions, SDK, and icon steps.

### test(qa): add focused automated coverage

- Added tests for scripture normalization, badge thresholds/progress, and analytics counts.
- Added typecheck script and full web/native QA checklists.
