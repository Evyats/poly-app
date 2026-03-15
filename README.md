# PolyApp

PolyApp is a browser mini-app hub for personal tracking tools (reps, wake-up, weight, routine, vocabulary trainer).

## Stack

- Frontend: React + TypeScript + Tailwind + Recharts
- Backend: FastAPI + SQLAlchemy
- DB: PostgreSQL
- Auth: Google OAuth + allowed-email whitelist + session cookie

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

1. `[Setup]` Create the backend env file:
   - copy `.env.example` to `.env`
2. `[Env changes]` Update the env vars in `.env`:
   - set the local values you want for `DATABASE_URL`, `SESSION_SECRET_KEY`, `AUTH_MODE`, and any auth/cors settings you need
3. `[Every run]` Start Postgres:
   - `docker compose up postgres`
4. `[Setup]` Create the backend virtual environment:
   - `python -m venv .venv`
5. `[Every run]` Activate the backend virtual environment:
   - `.venv\Scripts\activate`
6. `[Setup/deps]` Install backend dependencies:
   - `pip install -r backend/requirements.txt`
7. `[Setup/schema]` Run DB migrations:
   - `alembic upgrade head`
8. `[Every run]` Start the backend:
   - `uvicorn backend.main:app --reload --port 8765`
9. `[Setup/deps]` Install frontend dependencies in another terminal:
   - `cd frontend`
   - `npm install`
10. `[Every run]` Start the frontend in that terminal:
   - `cd frontend`
   - `npm run dev`
11. `[Every run]` Open:
   - `http://localhost:4173`

## AWS Updates

Use this after changes are merged and you want to update the EC2 deployment.

1. `[Every update]` SSH into the EC2 instance and go to the repo:
   - `cd ~/poly-app`
   - `git pull`
2. `[Backend deps changed]` Update backend packages:
   - `source .venv/bin/activate`
   - `pip install -r backend/requirements.txt`
3. `[Schema changed]` Run DB migrations:
   - `source .venv/bin/activate`
   - `alembic upgrade head`
4. `[Frontend changed]` Rebuild and publish the frontend:
   - `cd frontend`
   - `npm ci`
   - `npm run build`
   - `cd ..`
   - `sudo rm -rf /var/www/polyapp/*`
   - `sudo cp -r ~/poly-app/frontend/dist/* /var/www/polyapp/`
   - `sudo systemctl reload nginx`
5. `[Backend changed]` Restart the backend service:
   - restart `gunicorn`
6. `[Env changes]` Update `.env`, then restart the backend service:
   - restart `gunicorn`
7. `[Verify]` Check the deployment:
   - `curl http://127.0.0.1:8765/api/health`
   - open the site in the browser
