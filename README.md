# HRIS — Employee Self-Service PWA

Employee-facing progressive web app (`hris-user`) for the HRIS system. Employees
use it to clock in/out, view payslips, manage their profile and government/bank
details, request documents, and file leave/overtime. It is a standalone React
(Vite) app that consumes the same API as the admin console — the backend and
admin frontend live in the separate `hris` repo.

## Stack

- React 19 + Vite 8, React Router 7
- `vite-plugin-pwa` (Workbox) — installable, offline-capable, auto-updating
- TanStack Query for data fetching, Axios for HTTP (`src/api/index.js`)
- Tailwind CSS 4, Formik for forms, `sonner` for toasts, `framer-motion`, `lucide-react`
- `@aws-amplify/ui-react-liveness` + `aws-amplify` — AWS Face Liveness for verified clock-in
- `addresspinas` — Philippine PSGC address dataset (profile Home Address picker)
- `oxlint` for linting

## Prerequisites

- Node.js 18+
- A running `hris-backend` API (see the `hris` repo) reachable from this app

## Getting started

```bash
npm install
cp .env.example .env     # set VITE_API_BASE_URL to your backend URL
npm run dev              # Vite dev server, default http://localhost:5173
```

The backend's `CLIENT_URL` must include this app's origin (CORS allowlist), and
the backend must be able to set its `refreshToken` cookie for this origin — see
**Authentication** below.

## Environment configuration

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the `hris-backend` API, e.g. `http://localhost:4000` |

## Scripts

```bash
npm run dev        # Vite dev server (PWA dev options enabled)
npm run build       # production build
npm run preview      # preview a production build
npm run lint          # oxlint
```

## Project structure

```
src/
├── pages/
│   ├── Landing.jsx            Public marketing/landing page ( / )
│   ├── Login.jsx               Email + password, then SMS OTP 2FA
│   ├── ForgotPassword.jsx      SMS-verified password reset
│   ├── Home.jsx                Dashboard: stat tiles, clock in/out, quick actions
│   ├── EditProfile.jsx         Self-edit contact / address / emergency contact ( /profile )
│   ├── GovernmentDetails.jsx   SSS/PhilHealth/Pag-IBIG/TIN + payroll bank account + employment history
│   ├── Payroll.jsx             Payslip list/view + official payslip copy requests
│   ├── Documents.jsx           Document library + upload + HR document requests
│   └── Settings.jsx
├── layout/
│   └── ProtectedRoute.jsx     Auth + permission gate (see below)
├── components/                Shared UI (Custom* primitives) + feature subfolders:
│   ├── attendance/            FaceVerifyModal, FaceLivenessCheck
│   ├── schedule/              MyScheduleCard, HolidayCalendarModal
│   ├── leave/ overtime/       Request modals (feature-flag gated)
│   ├── payroll/ document/ announcement/
│   └── InstallBanner.jsx      PWA "Add to Home Screen" prompt
├── hooks/                     TanStack Query hooks, one per feature area
├── services/                  Axios endpoint wrappers, one per feature area
├── api/index.js               Axios instance + auth/refresh interceptor
└── utils/
    ├── permissionCheck.js     can() / permission store
    ├── psgc.js                Philippine address helpers
    └── constants.js           Enums mirrored from the backend
```

## Authentication

- **Login** is email + password, then a second step: an SMS OTP (`login_2fa`).
  Outside production the code is echoed in the API response for convenience.
- On success the API returns a short-lived **access token** (stored in
  `localStorage.accessToken`) and sets a long-lived **refresh token** as an
  httpOnly cookie.
- `src/api/index.js` attaches the access token to every request. On a `401` it
  makes a single silent call to `/auth/refresh` (with credentials), stores the
  new access token, and retries the original request. If the refresh fails the
  token is cleared and the user is sent to `/login`.
- The user's **permission slugs** are Base64-encoded in `sessionStorage`
  (`permissions`) and read by `can()` in `utils/permissionCheck.js`.

## Access control

`ProtectedRoute` enforces two layers:

1. **Portal gate** — the account must hold `employee-portal:access`, otherwise it
   is admin-only and gets a "no employee portal access" screen.
2. **Route permission** — routes pass a `permission` prop that must be satisfied,
   e.g. `my-payslips:view`, `my-documents:view`, `my-profile:view`,
   `my-government-details:view`, `my-attendance:view`, `my-overtime:create`.

Permissions are administered from the admin console's Roles & Permissions page
(`SELF_SERVICE` scope).

## Feature flags

Some actions (e.g. **File Overtime**, face-verified clock-in) are gated by
backend `system.settings` feature flags such as `overtime.enabled` and
`face.clockin_enabled`, read via `useFeatureFlag`. A disabled flag hides the
action entirely.

## PWA notes

- `registerType: 'autoUpdate'` — a new deploy refreshes clients automatically.
- Two heavy, feature-specific bundles are code-split and excluded from the
  precache, then runtime-cached on first use (`vite.config.js`):
  - the Amplify **Face Liveness** UI (`FaceLivenessCheck-*`)
  - the **PSGC address dataset** from `addresspinas` (~1.9 MB, `address-data-*`),
    only pulled when editing the profile Home Address.
- Update the `manifest` block in `vite.config.js` (name, icons, screenshots)
  before shipping — it currently carries template placeholders.

## Related

- `hris` — the admin platform monorepo: the Express/PostgreSQL API this app
  consumes, plus the HR/admin React console.
