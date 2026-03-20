# TAM Dental – Store Publishing Guide
## Angular + Ionic + Capacitor → Google Play & App Store

---

## Overview

This guide covers publishing the **Angular/Ionic** version of the TAM Dental app
to both stores using **Capacitor** as the native bridge.

```
Angular (Web) ──[Capacitor]──► Android APK/AAB  →  Google Play
                           └──► iOS IPA          →  App Store
```

---

## Prerequisites

| Tool | Version | Required for |
|---|---|---|
| Node.js | ≥ 18 LTS | Build toolchain |
| Angular CLI | 17.x | `ng build` |
| Capacitor CLI | 5.x | `cap sync`, `cap open` |
| Android Studio | Hedgehog+ | Android builds |
| Xcode | 15+ | iOS builds (macOS only) |
| Apple Developer Account | $99/year | App Store |
| Google Play Developer Account | $25 one-time | Google Play |

---

## Step 1 – Install Dependencies

```bash
cd artifacts/tam-dental-angular
npm install
```

---

## Step 2 – Build the Web App

```bash
ng build --configuration production
```

Output goes to `dist/tam-dental-angular/`.

---

## Step 3 – Add Native Platforms (first time only)

```bash
npx cap add android
npx cap add ios        # macOS only
```

---

## Step 4 – Copy Assets to Native Projects

```bash
npx cap copy android
npx cap copy ios
npx cap sync          # Copies + installs plugin dependencies
```

---

## Step 5 – Android Build (Google Play)

```bash
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to finish.
2. **Build → Generate Signed Bundle/APK**
3. Choose **Android App Bundle (.aab)** — required by Play Store.
4. Select or create your keystore (see `store/android/build.gradle` for keytool command).
5. Choose `release` build variant.
6. The signed `.aab` is produced in `android/app/release/`.

Upload to [play.google.com/console](https://play.google.com/console).

---

## Step 6 – iOS Build (App Store)

```bash
npx cap open ios        # Opens Xcode
```

In Xcode:
1. Select your Team under **Signing & Capabilities**.
2. Set **Bundle Identifier** = `sa.tamdental.patient`.
3. **Product → Archive**.
4. In Organizer → **Distribute App → App Store Connect → Upload**.

Submit build at [appstoreconnect.apple.com](https://appstoreconnect.apple.com).

---

## App IDs & Versioning

| Platform | App ID | Version | Build |
|---|---|---|---|
| Android | `sa.tamdental.patient` | `1.0.0` | `1` (versionCode) |
| iOS | `sa.tamdental.patient` | `1.0.0` | `1` (CFBundleVersion) |

Increment **versionCode** (Android) and **CFBundleVersion** (iOS) with every upload.

---

## Environment Variables for CI/CD (GitHub Actions / Bitrise / Fastlane)

```bash
# Android signing
KEYSTORE_PATH=tam-dental-release.keystore
KEYSTORE_STORE_PASSWORD=***
KEYSTORE_KEY_ALIAS=tam-dental
KEYSTORE_KEY_PASSWORD=***

# iOS (Fastlane / Match)
APP_STORE_CONNECT_API_KEY_ID=***
APP_STORE_CONNECT_API_ISSUER_ID=***
APP_STORE_CONNECT_API_KEY_CONTENT=***   # base64-encoded .p8 file
MATCH_PASSWORD=***
```

---

## Submitting for Review

### Google Play
- Open Play Console → select app → Production → New release
- Upload `.aab`, fill release notes (EN + AR)
- Submit for review (typically 1–7 days)

### App Store
- Open App Store Connect → prepare version → add build
- Fill metadata, screenshots, review notes
- Set status to "Ready to Submit"
- Reviews typically take 1–3 days

### Demo Credentials for Reviewers
```
Phone:  +966 512 345 678  (or any Saudi number starting with 5)
OTP:    123456
```

---

## Folder Reference

```
store/
├── android/
│   ├── build.gradle               → app-level build.gradle (copy to android/app/)
│   ├── AndroidManifest.xml        → manifest (copy to android/app/src/main/)
│   └── google-play-store-metadata.md   → listing copy + checklist
└── ios/
    ├── Info.plist                 → iOS plist (copy to ios/App/App/)
    └── app-store-metadata.md      → listing copy + checklist
```

---

## Support
- TAM Dental development team: dev@tamdental.sa
- Capacitor documentation: https://capacitorjs.com/docs
- Ionic documentation: https://ionicframework.com/docs
