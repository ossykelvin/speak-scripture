# Android Packaging

The project uses Capacitor 8 with package ID `com.koptechnology.speakscripture`. Native speech recognition is provided by `@capgo/capacitor-speech-recognition`; its Android manifest supplies `RECORD_AUDIO`.

## Requirements

- Android Studio with Android SDK 36
- JDK 21 (use Android Studio's bundled JDK when available)
- An Android 7.0/API 24 or newer device or emulator
- Node.js 22 or newer

Java and `ANDROID_HOME` were not configured on the machine used for this preparation, so Gradle APK compilation was not run here.

## Build and Sync

```bash
npm install
npm run mobile:build
npm run mobile:open:android
```

Run `npm run mobile:sync` after native plugin/config changes. Run `npm run mobile:build` after web code or environment changes.

## Debug APK

In Android Studio:

1. Allow Gradle sync to finish.
2. Select a device and run the app for device QA.
3. Choose **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Find the APK under `android/app/build/outputs/apk/debug/`.

Command line after JDK/SDK setup:

```powershell
cd android
.\gradlew assembleDebug
```

## Release APK or AAB

Create a private signing keystore and keep credentials outside source control. In Android Studio choose **Build > Generate Signed Bundle / APK**, select Android App Bundle for Play Store submission, and save the output from `android/app/build/outputs/bundle/release/`.

Increase `versionCode` and update `versionName` in `android/app/build.gradle` for every store release.

## Permissions and Speech

- Android requests microphone permission on first native listening attempt.
- Denied permission shows guidance and leaves manual text search available.
- Speech recognition availability depends on the device's installed recognition service and language support.
- Test pause/restart behavior on physical devices from each supported Android version.

## Icons

Capacitor generated placeholder launcher and adaptive icons under `android/app/src/main/res/mipmap-*`. Replace them using Android Studio **Image Asset** before release. Also replace `public/favicon.ico` and add production PWA icon sizes.

## Device QA

- Fresh install and first launch
- Grant and deny microphone permission
- Native listening returns transcript-based references
- Manual text lookup works without microphone permission
- Full verse text displays
- Stop/restart listening several times
- History survives app restart
- Badges and analytics update
- Auth/OAuth redirects return to the app as designed
- Offline and poor-network error messages are readable
- Light/dark theme and small-screen layout
