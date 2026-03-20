# TAM Dental – Angular / Ionic App

Patient-facing mobile app for TAM Dental Clinics (عيادات تام للأسنان), built with:
- **Angular 17** (lazy-loaded NgModule routing)
- **Ionic 7** (cross-platform UI components)
- **Capacitor 5** (native iOS / Android bridge)

---

## Brand Colors
| Role | Hex |
|---|---|
| Primary | `#1691D0` |
| White | `#FFFFFF` |
| Secondary (light blue) | `#87B3D4` |
| Gray | `#6F7374` |

---

## Features
| # | Feature | Screen |
|---|---|---|
| 1 | Phone + OTP login | `login` |
| 2 | GPS Check-in | `home` |
| 3 | Appointment management | `appointments` |
| 4 | Online booking | `appointments` |
| 5 | Invoices & payments | `billing` |
| 6 | Prescriptions | `health` |
| 7 | Questionnaires & consents | `health` |
| 8 | Clinic contact (call / WhatsApp) | `home`, `profile` |
| 9 | Document requests | `health` |
| 10 | Family member management | `profile` |

All screens support **English and Arabic with full RTL layout**.

---

## Project Structure
```
src/
├── app/
│   ├── pages/
│   │   ├── login/           # Phone + OTP auth
│   │   ├── tabs/            # Bottom tab container
│   │   ├── home/            # Dashboard
│   │   ├── appointments/    # Appointment list & management
│   │   ├── health/          # Prescriptions & questionnaires
│   │   ├── billing/         # Invoices & payment
│   │   └── profile/         # Patient info, language, sign out
│   ├── services/
│   │   ├── auth.service.ts      # Login / logout / OTP
│   │   ├── language.service.ts  # EN/AR + translations
│   │   └── app-data.service.ts  # Patient data, appointments, invoices
│   ├── guards/
│   │   └── auth.guard.ts        # Route protection
│   └── models/index.ts          # TypeScript interfaces
├── theme/variables.scss         # Ionic + brand CSS vars
└── global.scss                  # Global shared styles
store/
├── android/
│   ├── build.gradle             # Copy to android/app/
│   └── AndroidManifest.xml      # Copy to android/app/src/main/
├── ios/
│   └── Info.plist               # Copy to ios/App/App/
└── PUBLISHING-GUIDE.md          # Complete step-by-step guide
```

---

## Development

```bash
npm install
npm start           # Angular dev server at http://localhost:4200
```

---

## Build for Production

```bash
ng build --configuration production
```

---

## Native Mobile Builds

```bash
# First time – add platforms
npx cap add android
npx cap add ios     # macOS + Xcode required

# Every build
ng build --configuration production
npx cap sync

# Open native IDEs
npx cap open android    # Android Studio
npx cap open ios        # Xcode (macOS only)
```

See `store/PUBLISHING-GUIDE.md` for full store submission instructions.

---

## Demo Login
- **Phone**: any Saudi number starting with 5 (e.g. 512345678)
- **OTP**: `123456`

---

## App ID
`sa.tamdental.patient`
