# Admin Lite Backend

Lightweight FastAPI service for Admin Dashboard analytics with minimal environment requirements.

## Required environment variables

- `USER_DATABASE_URL`
- `CHAT_DATABASE_URL` (can be same as `USER_DATABASE_URL`)
- `ADMIN_TOKEN`

Optional:

- `DB_POOL_RECYCLE` (default: `1800`)
- `DB_POOL_PRE_PING` (default: `true`)

## Local run

```bash
cd admin-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8010 --reload
```

## Vercel deploy

1. Create a new Vercel project rooted at `admin-backend/`.
2. Add environment variables listed above in Vercel Production environment.
3. Deploy.

## Smoke checks

```bash
curl -sf https://<admin-backend-domain>/api/health
curl -sf -H "x-admin-token: <ADMIN_TOKEN>" https://<admin-backend-domain>/api/admin/overview
curl -sf -H "x-admin-token: <ADMIN_TOKEN>" https://<admin-backend-domain>/api/admin/users/analytics
```

## Admin Dashboard wiring

Set these in Admin Dashboard runtime:

- `ADMIN_BACKEND_URL=https://<admin-backend-domain>`
- `ADMIN_TOKEN=<same token as admin-backend>`

