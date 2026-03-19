# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a TAM Dental Patient mobile application built with Expo.

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
- **Mobile**: Expo SDK 54, Expo Router (file-based routing)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── tam-dental/         # TAM Dental Patient Expo mobile app
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

## TAM Dental Patient App (`artifacts/tam-dental`)

A full-featured dental patient mobile app for TAM Dental Clinic (tamdental.sa).

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
10. **Document Requests** — Radiograph, sick leave, reports (submits to backend)

### Color Palette
- Primary: `#0A5F7A` (deep teal)
- Accent: `#00C4B4` (bright teal)
- Background: `#F5F8FA`

### File Structure
```
app/
  _layout.tsx               # Root layout with providers
  (tabs)/
    _layout.tsx             # Tab layout (NativeTabs/Tabs with liquid glass)
    index.tsx               # Home dashboard
    appointments.tsx        # Appointments list
    health.tsx              # Prescriptions & forms
    billing.tsx             # Invoices & payments
    profile.tsx             # Profile & quick actions
  appointment/[id].tsx      # Appointment detail + check-in
  book-appointment.tsx      # 3-step booking modal
  invoice/[id].tsx          # Invoice detail + pay
  prescription/[id].tsx     # Prescription viewer
  questionnaire/[id].tsx    # Form/questionnaire
  request.tsx               # Document request submission
context/
  AppContext.tsx             # Global app state (mock data)
constants/
  colors.ts                 # Design system colors
```
