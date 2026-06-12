# Changelog

## 2026-06-12

### feat(history): sync progress across signed-in devices

- Added an RLS-protected Supabase search history table tied to authenticated users.
- Kept user-scoped localStorage for offline access and fast startup.
- Replaces the signed-in account's device history with authoritative Supabase history after login.
- Keeps guest history separate instead of uploading it during authentication.
- Shows cloud synchronization status on Home and Profile.
- Records successful local-history imports and sync counts on the user's profile.

### fix(mobile): retain listening and persist every search

- Kept Android speech recognition active across normal silence boundaries until the user stops it.
- Recorded every microphone and manual lookup immediately in history.
- Added successful-search totals and recent successful searches to the user profile.
- Removed narrow-screen overflow and added Android safe-area layout support.
- Increased primary mobile navigation controls to Android-friendly touch targets.
- Removed downloadable APK files from packaged WebView assets to prevent recursive APK growth.
- Disabled Android backup for locally stored conversation history.
- Added configurable request timeouts for scripture detection and verse retrieval.
- Advanced Android and About-screen version metadata to `1.1.0` (`versionCode 2`).
- Aligned authentication branding and replaced the malformed password placeholder.

### fix(android): allow native WebView Edge Function requests

- Added explicit CORS support for Vercel and Capacitor Android origins.
- Echoes only trusted request origins and varies responses by `Origin`.
- Added clearer client guidance for Edge Function transport failures.

## 2026-06-11

### design(branding): replace Lovable icon assets

- Added a custom Speak Scripture open-Bible and sound-wave app mark.
- Replaced the browser favicon, Apple touch icon, PWA icons, and Android launcher/adaptive icon assets.
- Updated web manifest and browser theme colors to match the new deep-navy brand.

### build(android): publish downloadable APK artifacts

- Added a GitHub Actions workflow that builds the current web bundle and Android debug APK.
- Publishes `Speak-Scripture-debug.apk` as a downloadable workflow artifact for 30 days.
- Published the verified APK under `/downloads` and added an in-app download link.

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
