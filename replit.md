# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a TAM Dental Patient mobile application built with **Expo/React Native** and an **Angular/Ionic** version with Capacitor for native store publishing.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile (Expo)**: Expo SDK 54, Expo Router (file-based routing)
- **Mobile (Angular)**: Angular 17 + Ionic 7 + Capacitor 5

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   ├── tam-dental/         # TAM Dental Patient Expo mobile app (primary)
│   └── tam-dental-angular/ # TAM Dental Angular/Ionic version (for stores)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

---

## TAM Dental Patient App – Expo (`artifacts/tam-dental`)

A full-featured dental patient mobile app for TAM Dental Clinic (tamdental.sa).

### Brand Colors
- Primary: `#1691D0` (brand blue)
- Secondary: `#87B3D4` (light blue)
- Gray: `#6F7374`
- White: `#FFFFFF`

### Features
1. **Check In** — GPS-based check-in when within 500m of clinic
2. **Appointment Management** — Confirm/cancel with 24-hour restriction
3. **Upcoming Appointments** — View and manage all appointments
4. **Book Appointment** — 3-step booking flow (doctor → date/time → reason)
5. **Invoices & Payments** — View bills and pay online
6. **Prescriptions** — Doctor-signed prescription viewer
7. **Questionnaires & Consents** — Medical history, consent forms, surveys
8. **Call Clinic** — Direct phone dialing
9. **WhatsApp** — Direct WhatsApp chat link
10. **Document Requests** — Radiograph, sick leave, reports

### Store Publishing (Expo / EAS)
- `eas.json` — EAS Build + Submit configuration
- `app.json` — Bundle ID `sa.tamdental.patient`, permissions declared for iOS + Android

### Auth
- Phone (Saudi +966) + OTP login
- Demo: any phone starting with 5, OTP = `123456`

---

## TAM Dental Angular/Ionic App (`artifacts/tam-dental-angular`)

Angular 17 + Ionic 7 + Capacitor 5 version. Full feature parity with Expo app.

### Structure
```
src/app/
  pages/
    login/          # Phone + OTP auth
    tabs/           # Bottom tab container
    home/           # Dashboard with GPS check-in, alerts, quick actions
    appointments/   # Appointment list + cancel
    health/         # Prescriptions + questionnaires
    billing/        # Invoices + pay
    profile/        # Patient info, family, language, sign out
  services/
    auth.service.ts       # Login/logout, Capacitor Preferences
    language.service.ts   # EN/AR with RTL, all translations inline
    app-data.service.ts   # Patient data, appointments, invoices, prescriptions
  guards/auth.guard.ts    # Route protection
  models/index.ts         # TypeScript interfaces
theme/variables.scss      # Ionic + brand CSS custom properties
global.scss               # Shared component styles
```

### Store Publishing Files (`artifacts/tam-dental-angular/store/`)
```
store/
  android/
    build.gradle              # Gradle config (copy to android/app/)
    AndroidManifest.xml       # Permissions + activities (copy to android/app/src/main/)
    google-play-store-metadata.md  # Listing copy + submission checklist
  ios/
    Info.plist                # Permission strings + capabilities (copy to ios/App/App/)
    app-store-metadata.md     # Listing copy + Xcode/review notes
  PUBLISHING-GUIDE.md         # Step-by-step build & submission guide
```

App ID: `sa.tamdental.patient` (same for both platforms and both app versions)
