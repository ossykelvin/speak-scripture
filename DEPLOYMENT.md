# Vercel Deployment

## Project Settings

- Framework preset: Vite
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Node.js: 22 or newer

`vercel.json` contains the SPA rewrite needed for direct visits and refreshes on `/about`, `/analytics`, `/auth`, and `/profile`.

## Deploy with Git

1. Push this directory to a Git provider.
2. Import the repository in Vercel.
3. Add every required browser variable from `.env.example`.
4. Deploy and verify the generated URL.
5. Set `VITE_APP_URL` and Supabase `ALLOWED_ORIGIN` to the final production URL.
6. Add the production and preview callback URLs to Supabase Auth redirect URL settings.

## Deploy with CLI

```bash
npm install -g vercel
vercel
vercel --prod
```

For a controlled prebuilt deployment:

```bash
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
```

## Supabase Edge Function

Configure the server-only secrets described in `ENVIRONMENT.md`, then deploy:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_ID
npx supabase functions deploy extract-references
```

## Troubleshooting

- Blank page: confirm Vercel has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then redeploy.
- Route refresh returns 404: confirm `vercel.json` is at the project root.
- Scripture detection fails: inspect Supabase function logs and verify all AI gateway secrets.
- Verse text fails: verify `VITE_BIBLE_API_BASE_URL` is reachable from the browser.
- OAuth returns to the wrong site: update Supabase Auth site URL/redirect allowlist.
- Microphone denied: serve over HTTPS and reset site microphone permission.
- Build uses stale values: Vite variables are build-time values; redeploy after changing them.

## Production Checklist

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- Test all routes by direct URL and browser refresh
- Test sign-up, sign-in, sign-out, and OAuth callback
- Test microphone and manual text lookup
- Confirm Supabase function CORS origin
