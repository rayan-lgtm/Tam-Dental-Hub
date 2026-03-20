# App Store Connect – TAM Dental Submission Metadata

## App Identity
| Field | Value |
|---|---|
| App Name (EN) | TAM Dental |
| App Name (AR) | تام للأسنان |
| Bundle ID | `sa.tamdental.patient` |
| SKU | TAM-DENTAL-001 |
| Primary Category | Health & Fitness |
| Secondary Category | Medical |
| Age Rating | 4+ |
| Version | 1.0.0 |
| Build | 1 |

---

## Subtitle (EN – max 30 chars)
```
Your Digital Dental Portal
```

## Subtitle (AR – max 30 chars)
```
بوابتك الرقمية لطب الأسنان
```

---

## Description (EN – max 4,000 chars)
```
TAM Dental Patient App is your digital companion for managing your dental care at
TAM Dental Clinics in Saudi Arabia.

KEY FEATURES
• GPS Check-In – Confirm arrival when within 500 m of the clinic.
• Appointments – View, manage, and cancel appointments.
• Online Booking – Schedule appointments directly from the app.
• Invoices & Payments – View itemised bills and pay securely.
• Prescriptions – View signed digital prescriptions.
• Questionnaires – Complete pre-visit forms and consent documents.
• Clinic Contact – Call or WhatsApp the clinic in one tap.
• Document Requests – Request sick-leave letters, reports, and X-rays.
• Family Members – Manage dental care for your entire family.
• Full Arabic & English with RTL layout support.
```

---

## Keywords (EN – max 100 chars, comma separated)
```
dental,dentist,clinic,appointment,health,teeth,Saudi Arabia,TAM,الأسنان,تام
```

---

## Privacy Policy URL
```
https://tamdental.sa/privacy-policy
```

## Support URL
```
https://tamdental.sa/support
```

## Marketing URL (optional)
```
https://tamdental.sa/app
```

---

## App Store Screenshots Required
| Device | Count | Size |
|---|---|---|
| iPhone 6.7" (iPhone 15 Pro Max) | 3–10 | 1320×2868 px |
| iPhone 6.1" (iPhone 15) | 3–10 | 1179×2556 px |
| iPhone 5.5" (required) | 3–10 | 1242×2208 px |
| iPad Pro 12.9" (required for iPad) | 3–10 | 2048×2732 px |

All screenshots should show the app in Arabic (RTL) on at least 2 and English on the rest.

---

## Build & Release Steps

### 1. Install Xcode (macOS required)
Xcode must be installed from the Mac App Store. A Mac is required for iOS builds.

### 2. Build the Angular App
```bash
ng build --configuration production
npx cap sync ios
npx cap open ios
```

### 3. Configure Xcode
- Set **Bundle Identifier** to `sa.tamdental.patient`
- Set **Team** to your Apple Developer Team
- Set **Version** to `1.0.0` and **Build** to `1`
- Enable **Automatically manage signing**

### 4. Create App in App Store Connect
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. My Apps → "+" → New App
3. Platform: iOS, Name: TAM Dental, Bundle ID: `sa.tamdental.patient`

### 5. Archive and Upload
- In Xcode: **Product → Archive**
- **Distribute App → App Store Connect → Upload**
- Wait for processing (10–30 minutes)

### 6. Submit for Review
- Add build to version in App Store Connect
- Fill all metadata fields
- Provide demo account: phone +966 5XXXXXXXX, OTP: 123456
- Answer all privacy and content questions
- Submit for Review

### 7. Apple Review Notes (Demo Instructions)
```
This is a healthcare appointment management app for TAM Dental Clinics, Saudi Arabia.

Demo login:
• Enter any Saudi mobile number starting with 5 (e.g., 512345678)
• Enter OTP code: 123456
• This bypasses the real OTP system in demo mode

GPS Check-in:
• Tap "Check In" on the Home screen
• In simulator, set location to: 24.7136, 46.6753 (Riyadh)
```

---

## App Store Checklist
- [ ] Bundle ID registered in Apple Developer Portal
- [ ] App created in App Store Connect
- [ ] Privacy Policy URL live and accessible
- [ ] All metadata filled in EN and AR
- [ ] Screenshots prepared for required device sizes
- [ ] Age rating questionnaire completed
- [ ] Privacy nutrition label filled (phone number collected, encrypted)
- [ ] Data use declared: phone number for authentication
- [ ] Build uploaded via Xcode Organizer
- [ ] Demo account instructions provided in Review Notes
- [ ] Export Compliance: standard encryption (HTTPS/TLS) = YES

---

## Capacitor iOS Podfile (ios/App/Podfile)
```ruby
require_relative '../../node_modules/@capacitor/ios/scripts/pods_helpers'

platform :ios, '13.0'
use_frameworks!

target 'App' do
  capacitor_pods
  # Capacitor plugins:
  pod 'CapacitorApp',         :path => '../../node_modules/@capacitor/app'
  pod 'CapacitorGeolocation', :path => '../../node_modules/@capacitor/geolocation'
  pod 'CapacitorHaptics',     :path => '../../node_modules/@capacitor/haptics'
  pod 'CapacitorPreferences', :path => '../../node_modules/@capacitor/preferences'
end

post_install do |installer|
  assertDeploymentTarget(installer)
end
```
