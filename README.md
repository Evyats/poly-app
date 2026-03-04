# PolyApp

PolyApp is a browser mini-app hub for personal tracking tools (reps, wake-up, weight, routine, vocabulary trainer).

## Stack

- Frontend: React + TypeScript + Tailwind + Recharts
- Backend: FastAPI + SQLAlchemy
- DB: PostgreSQL
- Auth: Google OAuth + allowed-email whitelist + session cookie

## Production-Oriented Changes Included

- Alembic migrations (instead of runtime `create_all` schema creation)
- Gunicorn config for FastAPI app workers
- Nginx configs for:
  - static frontend serving
  - `/api` reverse proxy
  - HTTPS variant
- Secure cookie settings via env (`SESSION_COOKIE_SECURE`, `SESSION_COOKIE_SAMESITE`, `SESSION_COOKIE_NAME`)
- Structured JSON logging in backend

## Backend Env Vars (`.env`)

Start from `.env.example`.

Required/important:

- `DATABASE_URL=...`
- `SESSION_SECRET_KEY=<long-random-secret>` (required; app fails if missing)
- `ENVIRONMENT=development|production`
- `SESSION_COOKIE_SECURE=true|false`
- `SESSION_COOKIE_SAMESITE=lax|strict|none`
- `CORS_ORIGINS=https://your-domain.com`
- `AUTH_MODE=oauth|dev_auto`
- `GOOGLE_CLIENT_ID=...apps.googleusercontent.com` (for oauth mode)

## Local Development

1. Start Postgres:
   - `docker compose up postgres`
2. Create venv + install backend deps:
   - `python -m venv .venv`
   - `.venv\Scripts\activate`
   - `pip install -r backend/requirements.txt`
3. Create `.env` in repo root (copy `.env.example` and edit values).
4. Run DB migrations:
   - `alembic upgrade head`
5. Run backend:
   - `uvicorn backend.main:app --reload --port 8765`
6. Run frontend (another terminal):
   - `cd frontend`
   - `npm install`
   - `npm run dev`
7. Open:
   - `http://localhost:4173`

## Local Production-Like Run (Gunicorn + Nginx style)

1. Build frontend:
   - `cd frontend`
   - `npm install`
   - `npm run build`
2. Install backend deps + migrate:
   - `pip install -r backend/requirements.txt`
   - `alembic upgrade head`
3. Run backend with Gunicorn:
   - `gunicorn -c backend/gunicorn_conf.py backend.main:app`
4. Use nginx config template:
   - `deploy/nginx/polyapp.conf`
   - HTTPS variant: `deploy/nginx/polyapp-https.conf`

## Alembic

- Current initial migration:
  - `alembic/versions/20260304_000001_initial_schema.py`
- Apply migrations:
  - `alembic upgrade head`
- Create new migration after model changes:
  - `alembic revision -m "describe-change"`
  - then edit the revision file and run `alembic upgrade head`

## AWS EC2 + RDS Checklist (Your Chosen Path)

1. Provision RDS PostgreSQL.
2. Provision EC2.
3. Security groups:
   - EC2: allow `80/443` from internet, `22` from your IP only.
   - RDS: allow DB port from EC2 security group only.
4. Clone app on EC2 and set `.env` with production values.
5. Set `DATABASE_URL` to RDS endpoint.
6. Install backend dependencies and run `alembic upgrade head`.
7. Build frontend (`npm run build`).
8. Start backend via gunicorn (`backend/gunicorn_conf.py`).
9. Configure nginx with one of the provided templates.
10. Add domain DNS to EC2 and enable HTTPS certs (Let's Encrypt).
11. Keep `SESSION_COOKIE_SECURE=true` in production.
12. Keep `CORS_ORIGINS` strict (only your real domain).

## Notes

- Backend now expects DB schema to exist via Alembic migration.
- If migrations were not run, startup can fail with:
  - `Database schema missing. Run: alembic upgrade head`
- For small private usage, `.env`-based secret storage on EC2 is acceptable if file permissions are locked down.
