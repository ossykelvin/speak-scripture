# Speak Scripture Mobile QA Report

Date: June 12, 2026

## Executive Summary

Speak Scripture is a React/Vite application packaged as an Android app with Capacitor 8.
The web build, automated tests, Capacitor sync, live scripture-detection backend, responsive
layouts, route handling, history, analytics, badges, permission logic, and Android CI build
were reviewed.

The reviewed source is suitable for continued Android testing. The final debug APK was built
successfully in GitHub Actions and inspected as a ZIP/APK artifact. Four medium defects and
two low defects were fixed. One high-risk mobile authentication gap remains: Google OAuth and
email-confirmation callbacks are not configured as Capacitor deep links and require real-device
provider integration before mobile authentication can be certified.

No emulator, Android SDK, Java runtime, ADB, or physical Android device was available on the
local QA machine. Installation, launch, actual microphone acoustics, Android permission dialogs,
background/resume, and OEM-specific behavior are therefore not marked as passed.

## Test Environment

| Item | Value |
| --- | --- |
| Host OS | Windows |
| Project path | `C:\Users\Administrator\OneDrive\Documents\Projects\speak-scripture-main\speak-scripture-main` |
| Node.js | `v24.14.1` |
| npm | `11.11.0` |
| Browser checks | Codex in-app Chromium browser |
| Android device/emulator | Not available |
| Local Java/Android SDK/ADB | Not available |
| Android CI | GitHub Actions, Ubuntu, Node 22, Java 21, Android SDK 36 |
| Production URL | `https://speak-scripture.vercel.app` |
| Final Android CI run | `27392587107` |

## Project Discovery

| Area | Discovered implementation |
| --- | --- |
| Web framework | React 18, Vite 5, TypeScript |
| UI | Tailwind CSS, shadcn/Radix primitives, Framer Motion |
| Package manager | npm with `package-lock.json` |
| Mobile wrapper | Capacitor 8 with a native Android project |
| Android project | `android/` |
| Android package ID | `com.koptechnology.speakscripture` |
| App name | Speak Scripture |
| Android version | `versionCode 2`, `versionName 1.1.0` |
| Minimum Android | API 24 / Android 7.0 |
| Target/compile SDK | API 36 |
| Web output | `dist/` |
| Speech | `@capgo/capacitor-speech-recognition` |
| Scripture detection | Supabase Edge Function `extract-references` |
| Verse content | Configured public Bible API |
| Authentication | Supabase email/password plus Lovable OAuth broker |
| History/analytics | Device `localStorage` |
| Badges | Configured thresholds from `VITE_BADGE_THRESHOLDS` |
| Android permission | `RECORD_AUDIO` supplied by the speech plugin; `INTERNET` in app manifest |

Required public environment variables are documented in `.env.example` and
`ENVIRONMENT.md`. Private Edge Function provider values remain server-side.

## Commands Executed

| Command | Result | Notes |
| --- | --- | --- |
| `npm run lint` | Pass with warnings | 0 errors; 9 existing Fast Refresh warnings |
| `npm run typecheck` | Pass | No TypeScript errors |
| `npm test -- --run` | Pass | 6 files, 14 tests |
| `npm run build` | Pass | Vite production build completed |
| `npm run mobile:build` | Pass | Build, binary pruning, and Capacitor Android sync completed |
| `npm run mobile:prune-downloads` | Pass | Removed downloadable APKs from mobile WebView assets |
| `./gradlew assembleDebug --no-daemon` locally | Not Executed | Java and Android SDK unavailable locally |
| GitHub Android workflow | Pass | Run `27392587107`, Java 21 / SDK 36 |

Build warnings:

- Main JavaScript chunk is approximately 766 KB before gzip and exceeds Vite's 500 KB advisory.
- Browserslist data is stale. Neither warning blocks the build.

## Test Coverage Matrix

| Test Area | Test Case | Method | Result | Notes |
| --------- | --------- | ------ | ------ | ----- |
| Installation | Debug APK generated | GitHub Actions | Pass | Final APK generated successfully |
| Installation | Install on Android | Device | Not Executed | No device, emulator, or ADB |
| Launch | Launch without crash | Device | Not Executed | Requires Android runtime |
| Launch | App name and package | Code review / APK assets | Pass | Correct name and package |
| Launch | Splash screen and icon assets | APK/code review | Code Review Only | Assets exist; visual device rendering not verified |
| Launch | Close and reopen | Code review | Code Review Only | History uses persistent localStorage |
| Navigation | Home renders | Browser | Pass | No console errors |
| Navigation | About, Analytics, Auth routes | Browser | Pass | Routes rendered successfully |
| Navigation | Browser back controls | Browser/code review | Pass | 44x44 px Back targets |
| Navigation | Web deep-link refresh | HTTP/browser | Pass | Routes return SPA `index.html` |
| Navigation | Unknown route | HTTP/browser | Pass | SPA loads and app renders Not Found |
| Navigation | Native OAuth callback deep link | Code review | Fail | No Capacitor callback intent/filter handling |
| Layout | 320x568 portrait | Browser viewport | Pass | No horizontal overflow |
| Layout | 390x844 portrait | Browser viewport | Pass | No horizontal overflow |
| Layout | 412x915 portrait | Browser viewport | Pass | No horizontal overflow |
| Layout | 800x360 landscape | Browser viewport | Pass | Core layout remains usable |
| Layout | Primary touch targets | Browser measurement | Pass | Header and Back controls are 44x44 px |
| Microphone | Permission requested on demand | Automated/code review | Pass | Request occurs only after Start |
| Microphone | Permission allowed | Automated hook test | Pass | Native listening starts |
| Microphone | Permission denied | Automated hook test | Pass | Settings/manual fallback guidance shown |
| Microphone | Permission denied permanently | Code review | Code Review Only | Same Android Settings guidance applies |
| Microphone | Listening remains active over silence | Automated hook test | Pass | Continuous native PTT path tested |
| Microphone | Stop releases listening | Automated hook test | Pass | PTT released and force stop called |
| Microphone | Real speech recognition | Device | Not Executed | Requires physical microphone/runtime |
| Scripture | `John 3:16` | Live Edge Function | Pass | Correct structured reference |
| Scripture | `John chapter 3 verse 16` | Live Edge Function | Pass | Correct structured reference |
| Scripture | `Romans 8:28` | Live Edge Function | Pass | Correct structured reference |
| Scripture | `Psalm 23:1` | Live Edge Function | Pass | Correct structured reference |
| Scripture | Multiple references | Live Edge Function | Pass | John 3:16 and Romans 8:28 returned |
| Scripture | Famous paraphrase | Live Edge Function | Pass | "the Lord is my shepherd" mapped to Psalm 23:1 |
| Scripture | No scripture | Live Edge Function | Pass | Empty result returned |
| Scripture | Structurally invalid reference | Live Edge/Bible APIs | Partial | Extractor accepts it; verse API returns 404 gracefully |
| Scripture | Verse text | Live Bible API/browser | Pass | Correct complete verse text returned |
| Results | Loading state | Production browser | Pass | Searching state shown |
| Results | Friendly transport error | Code review/previous production verification | Pass | Connection guidance shown |
| Results | Long/multiple results layout | Browser/code review | Pass | Cards wrap and prevent overflow |
| Results | Copy/share | Feature review | N/A | Feature is not implemented |
| History | Successful manual search retained | Production browser | Pass | Entry visible in History immediately |
| History | Microphone search retained | Automated unit test | Pass | Entry created immediately per lookup |
| History | Failed search not counted as success | Automated tests | Pass | Failure count separated |
| History | Persistence after reload/reopen | localStorage/code review | Code Review Only | Browser storage persists; Android process death not tested |
| Profile | Successful totals and recent searches | Browser/code review | Pass | Implemented from persisted history |
| Analytics | Success/failure totals | Automated test | Pass | Counts separated correctly |
| Analytics | Daily/weekly/monthly ranges | Code review | Code Review Only | Date range logic reviewed |
| Analytics | Empty state | Browser/code review | Pass | Empty UI is implemented |
| Badges | First threshold | Automated test | Pass | Unlocks at 1 |
| Badges | Exact threshold 10 | Automated test | Pass | Seeker unlocks at 10 |
| Badges | Progress and next target | Automated test | Pass | Next threshold calculated |
| Badges | Config parsing | Automated tests | Pass | Invalid/incomplete config falls back safely |
| Network | Edge request timeout | Automated test/code | Pass | Configurable 15-second default |
| Network | Bible API timeout | Automated test | Pass | AbortController prevents indefinite wait |
| Network | Offline friendly state | Code review | Code Review Only | Friendly retry guidance exists |
| Network | Recovery after network returns | Device/browser network control | Not Executed | Requires offline toggling |
| Security | Private secrets in client source | Static review | Pass | No private provider secrets found |
| Security | Public browser key handling | Static review | Pass | Publishable key is intentionally public |
| Privacy | Microphone disclosure | Browser/code review | Pass | About screen explains on-demand access |
| Privacy | Conversation history backup | Manifest inspection | Pass | Android backup disabled |
| Privacy | Local and profile history storage | Code review | Accepted Risk | Search text is cached locally and synced to the signed-in user's Supabase profile |
| Stability | Repeated input guard | Code review | Pass | Submit controls disable during processing |
| Stability | Listener cleanup | Automated/code review | Pass | Native listeners and microphone are cleaned up |
| Stability | Critical console errors | Browser | Pass | None during viewport/navigation checks |
| Performance | APK size | Artifact inspection | Pass | 5,549,991 bytes |
| Performance | Recursive APK packaging | Artifact inspection | Pass | Zero nested APK entries |
| Android | Capacitor `webDir` | Code review | Pass | `dist` |
| Android | Web assets copied | Capacitor sync/APK inspection | Pass | Assets present |
| Android | Gradle debug build | GitHub Actions | Pass | Run `27411817330` |
| Android | Manifest permissions | Source/plugin review | Pass | INTERNET and RECORD_AUDIO only |
| Android | Versioning | Gradle review | Pass | 2 / 1.1.0 |

## Defect Log

| ID | Area | Severity | Issue | Expected | Actual | Fix Applied | Retest Result | Status |
| -- | ---- | -------- | ----- | -------- | ------ | ----------- | ------------- | ------ |
| MOB-001 | Packaging | Medium | APK embedded the prior downloadable APK inside WebView assets | Mobile package excludes distribution binaries | APK was about 15.9 MB and contained a 10.7 MB nested APK | Added `mobile:prune-downloads` before Capacitor sync | Final APK 5.55 MB; zero nested APK entries | Closed |
| MOB-002 | Privacy | Medium | Android backup enabled for local conversation/search history | Local conversation history excluded from backups | `android:allowBackup="true"` | Disabled backup and full backup content | Manifest source and CI build verified | Closed |
| MOB-003 | Network | Medium | Edge and Bible requests had no upper time limit | Poor networks return control and retry guidance | Requests could remain pending indefinitely | Added configurable timeout and Bible fetch abort | Automated timeout tests pass | Closed |
| MOB-004 | Accessibility | Medium | Header icon hit areas were 16x16 px | Primary targets approximately 44x44 px or larger | Icons themselves were the clickable bounds | Added 44x44 px navigation targets | Measured at 44x44 px on 320 px viewport | Closed |
| MOB-005 | Release | Low | Android revisions remained version code 1 / version 1.0 | Each release advances metadata | Updated APKs reused initial metadata | Advanced to code 2 / version 1.1.0 | Source and CI build verified | Closed |
| MOB-006 | Auth UI | Low | Auth title differed from app name and password placeholder was malformed | Consistent branding and readable placeholder | "Scripture Listener" and malformed bullets | Uses configured app name and ASCII placeholder | Typecheck/build pass | Closed |
| MOB-007 | Authentication | High | Native OAuth/email confirmation callbacks are not configured as Capacitor deep links | External auth returns to the installed app | Redirect uses WebView origin and no native callback handler exists | None; provider/deep-link design required | Not retested | Open |
| MOB-008 | Validation | Low | Extractor accepts impossible references such as John 999:999 | Invalid references rejected before verse lookup | Verse API rejects later with 404 | Existing UI degrades gracefully | Graceful behavior verified | Open |
| MOB-009 | Performance | Low | Main JS bundle exceeds advisory size | Route-level payloads kept smaller | Main chunk approximately 766 KB before gzip | None in this scoped QA pass | Build warning remains | Open |
| MOB-010 | CI config | Low | Public deployment values are written directly in Android workflow YAML | Environment-specific values supplied by repository variables | Workflow contains public project/config values | None; changing requires repository variable setup | Not retested | Open |

## Fixes Applied

1. Removed downloadable APK files from mobile-packaged web assets.
2. Disabled Android backup for local search/conversation history.
3. Added configurable request timeout handling.
4. Added Bible API abort handling.
5. Improved timeout-specific user messaging.
6. Increased mobile navigation touch targets.
7. Added privacy disclosure to About.
8. Advanced Android/app version metadata.
9. Corrected Auth branding and password placeholder.
10. Added automated tests for timeout config, stalled requests, and denied microphone permission.
11. Added user-scoped local history plus Supabase synchronization protected by row-level security.

## Retest Results

- TypeScript: pass.
- Unit/component tests: 16/16 pass.
- Production web build: pass.
- Capacitor Android sync: pass.
- Android Gradle CI: pass.
- Responsive viewport matrix: pass.
- Touch target measurement: pass.
- Live Edge Function matrix: pass except invalid-reference validation limitation.
- Final APK inspection: pass, no nested APK.

## APK Status

| Item | Value |
| --- | --- |
| Build type | Debug APK |
| Android CI run | `27411817330` |
| Local repository path | `public/downloads/Speak-Scripture-v1.0-debug.apk` |
| Size | 5,549,991 bytes |
| SHA-256 | `455CA206D1A1E630BC6D1FA5469D1C1159D72CCC2644717FB8E0E9755894FBE3` |
| Nested APK entries | 0 |
| Version | 1.1.0 |
| Version code | 2 |

This is a debug build. Play Store or production distribution still requires release signing,
secure keystore management, and an Android App Bundle (`.aab`) pipeline.

## Screenshots

No screenshot files were persisted during this run. Responsive DOM measurements and live browser
state were inspected at 320x568, 390x844, 412x915, and 800x360.

## Risks and Limitations

1. Real-device installation, launch, microphone quality, permission dialogs, background/resume,
   rotation transitions, and process-death recovery remain untested.
2. Native Google OAuth and email confirmation callback handling is not release-ready.
3. Signed-in history is synchronized to Supabase at sign-in/app launch and after each search;
   it does not currently use real-time subscriptions while the same account is open on two devices.
4. History contains user search/spoken text. Android backup is disabled, but the local cache and
   account-level cloud records should be covered by a user-facing retention policy.
5. Invalid reference bounds are not validated before calling the Bible API.
6. The current artifact is debug-signed, not production-signed.
7. The primary JavaScript bundle should be split before lower-end-device performance certification.

## Recommended Next Steps

1. Implement and test a Capacitor App/Browser OAuth callback flow with an approved custom scheme
   or Android App Link, then configure matching Supabase/Google redirect allowlists.
2. Install the APK on at least Android 7, Android 12, and Android 15/16 devices or emulators.
3. Test Allow, Deny, and Don't Ask Again microphone paths on-device.
4. Test live speech in quiet, noisy, long-silence, and repeated-session conditions.
5. Add canonical Bible book/chapter/verse bounds validation.
6. Add explicit history retention and deletion controls for signed-in users.
7. Add release signing and AAB generation in CI.
8. Move environment-specific public CI values to GitHub repository variables.
9. Add route-level lazy loading and rerun startup profiling on a low-memory Android device.
