# Speak Scripture

Speak Scripture listens to speech or accepts typed text, detects explicit Bible references and familiar scripture quotations, then displays the normalized reference and complete verse text. Local and account-synced history power search analytics and configurable badge progress.

## Stack

- React 18, TypeScript, Vite, React Router, TanStack Query
- Tailwind CSS and shadcn/ui
- Supabase Auth, profiles, and the `extract-references` Edge Function
- `bible-api.com` compatible verse API
- Browser Speech Recognition on the web
- Capacitor 8 and native speech recognition on Android
- Vitest for unit tests

## Architecture

- Routes: `/`, `/about`, `/analytics`, `/auth`, `/profile`
- State: React component/context state; no external global state store
- Auth/profile storage: Supabase
- Search history/analytics/badges: user-scoped `localStorage` plus Supabase for signed-in users
- Reference detection: Supabase Edge Function calling a configured AI gateway
- Verse lookup: configurable public Bible API base URL
- Badge thresholds: `VITE_BADGE_THRESHOLDS`, parsed by `src/config`

## Local Setup

Requirements: Node.js 22 or newer and npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Populate `.env.local` before starting. See [ENVIRONMENT.md](./ENVIRONMENT.md).

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
npm run mobile:build
npm run mobile:open:android
```

## Deployment

Vercel uses `npm run build` and publishes `dist`. SPA rewrites are defined in `vercel.json`. See [DEPLOYMENT.md](./DEPLOYMENT.md).

## Android

The generated native project is in `android/`. Build and sync the web app with `npm run mobile:build`, then open Android Studio with `npm run mobile:open:android`. See [MOBILE_ANDROID.md](./MOBILE_ANDROID.md).

## Current Data Model

Authentication, profile names, and signed-in search history are cloud-backed. Search history is also cached locally for responsive and offline-friendly access. Guest history remains local and is merged into the user's profile after a successful sign-in and cloud sync.
