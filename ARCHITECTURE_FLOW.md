# Book With AI: End-to-End Architecture Flow

This document explains how the system currently works across:

- Website frontend: `frontend/`
- Backend API: `Admin-Dashboard/backend/`
- Admin dashboard frontend: `Admin-Dashboard/Frontend/`

It also calls out where data is live from DB/API vs where values are still mocked/derived.

---

## 1) High-Level Flow

### Website user flow

1. User opens website pages from `frontend/`.
2. Website frontend calls relative API paths like `/api/chat`, `/api/sessions`, `/api/trips`.
3. Next.js rewrite in `frontend/next.config.ts` proxies `/api/:path*` to backend:
   - `http://127.0.0.1:8000/api/:path*`
4. FastAPI backend handles requests (`Admin-Dashboard/backend/main.py` + `api/routes.py`).
5. Backend reads/writes:
   - User DB (`USER_DATABASE_URL`)
   - Chat DB (`CHAT_DATABASE_URL`)
6. Backend returns JSON to website frontend UI.

### Admin analytics flow

1. User opens admin dashboard from `Admin-Dashboard/Frontend/`.
2. Admin pages call local Next routes like `/api/admin/overview`, `/api/admin/api-monitoring`.
3. These Next route handlers call backend admin endpoints using `src/backend/admin-api.ts`.
4. `admin-api.ts` sends `x-admin-token` to backend.
5. Backend admin routes aggregate data from DB tables and return analytics payloads.
6. Admin UI renders charts/tables using transformed data from `src/backend/admin-data.ts`.

---

## 2) Website Frontend (`frontend/`)

## Runtime / Entrypoints

- Root layout: `frontend/src/app/layout.tsx`
- Chat page: `frontend/src/app/chat/page.tsx` -> `ChatClient`
- Dev command: `npm run dev` (typically `localhost:3000`, can shift to `3001`)

## Backend connectivity

- In chat client (`frontend/src/app/chat/ChatClient.tsx`), API base is `"/api"`.
- Rewrites in `frontend/next.config.ts` route these to FastAPI backend.
- No `frontend/src/app/api/*` handlers are used for business APIs (proxy rewrite model).

## Main API consumers in website

- `frontend/src/app/chat/ChatClient.tsx`
  - `/api/chat`
  - `/api/sessions`
  - `/api/sessions/{id}`
- `frontend/src/app/(main)/my-trips/page.tsx`
  - `/api/trips`
  - `/api/trips/{id}`
- `frontend/src/components/FeedbackWidget.tsx`
  - `/api/feedback`

## Auth behavior note

- Backend expects JWT or trusted proxy headers for many user-scoped routes.
- Current website frontend fetches are mostly plain calls (no explicit bearer attachment in these files).
- If protected endpoints work in a deployment, there is likely an upstream/session mechanism in play; validate for local parity.

---

## 3) Backend API (`Admin-Dashboard/backend/`)

## Entrypoint / router

- App entry: `Admin-Dashboard/backend/main.py`
- Router mount: `app.include_router(api_router, prefix="/api")`
- Main router: `Admin-Dashboard/backend/api/routes.py`

## CORS / origins

- Controlled via `ALLOWED_ORIGINS` env.
- Local defaults include localhost origins.

## Auth model

- User auth: `Admin-Dashboard/backend/auth.py`
  - JWT (`Authorization: Bearer ...`)
  - or trusted headers (`X-User-Id` + `X-Internal-Auth`)
- Admin auth:
  - `x-admin-token` checked by `require_admin` in `api/routes.py`

## Database setup

Defined in `Admin-Dashboard/backend/database.py`:

- User DB engine/session:
  - `USER_DATABASE_URL` (fallback `DATABASE_URL`)
- Chat DB engine/session:
  - `CHAT_DATABASE_URL` (fallback user DB)
- Separate bases:
  - `BaseUser`
  - `BaseChat`

## Key domain tables (already in code)

- User-side:
  - `users`
  - `travel_documents`
  - `travel_preferences`
  - `trips`
  - `price_alerts`
  - `feedback`
  - `consent_records`
  - `signup_otps`
  - `user_settings`
  - `travel_stats`
  - `achievements`
  - `user_achievements`
- Chat-side:
  - `chat_sessions`
  - `chat_messages`
  - `guest_passenger_profiles`

## API observability tables (added for monitoring)

- `api_request_logs`
  - request-level logs: path/method/status/latency/provider/key/user-agent/timestamp
- `api_metrics_1m`
  - minute buckets: request/success/error counts and latency aggregates
- `api_key_registry`
  - API key inventory with provider/status/last_used and key mask
- `api_provider_config`
  - provider-level quota and cost config (rate limits + cost modeling)

## API monitoring ingestion

In `main.py` middleware:

- For website APIs (`/api/*` excluding `/api/admin/*`):
  - logs each request to `api_request_logs`
  - upserts key usage in `api_key_registry`
  - updates minute aggregates in `api_metrics_1m`

## Admin analytics endpoints (examples)

- `/api/admin/metrics/overview`
- `/api/admin/users/analytics`
- `/api/admin/funnel`
- `/api/admin/behavior`
- `/api/admin/ai/performance`
- `/api/admin/retention`
- `/api/admin/sessions`
- `/api/admin/feedback/*`
- `/api/admin/api-monitoring`
- `/api/admin/api-keys` (GET/PATCH for key mgmt)

---

## 4) Admin Frontend (`Admin-Dashboard/Frontend/`)

## Runtime

- Root layout: `Admin-Dashboard/Frontend/src/app/layout.tsx`
- Uses app routes under `src/app/`.

## Backend call path

1. UI calls internal route: `/api/admin/...`
2. Route handler in `src/app/api/admin/**/route.ts`
3. Calls backend via `src/backend/admin-api.ts`
4. `admin-api.ts` sets `x-admin-token` and hits backend base URL

Env:

- `Admin-Dashboard/Frontend/.env`
  - `ADMIN_BACKEND_URL=http://127.0.0.1:8000`
  - `ADMIN_TOKEN=...`

## Data shaping layer

- `src/backend/admin-data.ts` transforms backend payloads into UI-friendly structures.
- Some dashboard values are derived/heuristic in this layer, not raw table columns.

---

## 5) Live vs Mock Status (Current)

## Website frontend

### Live-backed (API/DB connected)

- Chat flow (`/chat`)
- Session history APIs
- My Trips APIs
- Feedback submission

### Still static/mock-heavy

- Multiple non-chat pages/components in `frontend/src/app/(main)/...` and `frontend/src/components/...`
- Auth pages currently include simulated flow text and require real API hookup for true production behavior.

## Admin frontend

### Live-backed

- Core analytics pages call backend admin routes.
- API Monitoring now reads persisted observability data from DB-driven backend endpoint.

### Derived/heuristic areas

- Some visual KPIs/labels are adapter-derived in `admin-data.ts`.
- A few sections still use computed approximations when source telemetry is absent.

---

## 6) Operational Notes (Important)

- Website and admin must point to the **same backend instance + same DB** if you want matching numbers.
- If website hits deployed backend but admin hits local backend, monitoring will appear inconsistent.
- If `frontend` dev server crashes (e.g., turbopack cache corruption), website API traffic may never reach backend.

Recommended local run order:

1. Backend:
   - `cd Admin-Dashboard/backend`
   - `uvicorn main:app --reload`
2. Website frontend:
   - `cd frontend`
   - `rm -rf .next`
   - `npm run dev -- --webpack`
3. Admin frontend:
   - `cd Admin-Dashboard/Frontend`
   - `npm run dev`

---

## 7) Quick Reference: File Map

- Website API caller:
  - `frontend/src/app/chat/ChatClient.tsx`
- Website proxy rewrite:
  - `frontend/next.config.ts`
- Backend entry:
  - `Admin-Dashboard/backend/main.py`
- Backend routes:
  - `Admin-Dashboard/backend/api/routes.py`
- DB setup:
  - `Admin-Dashboard/backend/database.py`
- Admin backend fetch client:
  - `Admin-Dashboard/Frontend/src/backend/admin-api.ts`
- Admin data mapper:
  - `Admin-Dashboard/Frontend/src/backend/admin-data.ts`

