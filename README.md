# PolyApp

PolyApp is a browser-based mini-app hub for personal tracking tools.

## Stack

- Frontend: React + TypeScript + Tailwind CSS + Recharts
- Backend: FastAPI microservices (reps, wake-up, weight, routine) + SQLAlchemy
- Database: PostgreSQL (Docker Compose)
- Serving: `uvicorn` for backend APIs; can also serve built React app from FastAPI

## Auth

- Two auth behaviors are supported via config (`AUTH_MODE`):
  - `oauth`: real Google login
  - `dev_auto`: automatic login as a default DB user (for local testing)
- Only emails in the whitelist can access the app.
- Whitelist is stored in DB table `allowed_emails` and seeded from `ALLOWED_EMAILS` env var on startup.
- Sessions are cookie-based (server-side session middleware).
- Data is user-scoped in SQL tables by `user_id`.

## Auth Config (backend `.env`)

- `AUTH_MODE=oauth|dev_auto`
- `DEFAULT_APP_USERNAME=evyats`
- `DEFAULT_APP_EMAIL=` (optional)
- `GOOGLE_CLIENT_ID=...apps.googleusercontent.com` (required for `oauth`)
- `ALLOWED_EMAILS=a@x.com,b@y.com` (required for `oauth`)
- `SESSION_SECRET_KEY=<long-random-secret>`

## Features

- Home hub with navigation to all mini apps.
- Global light/dark theme toggle.
- Reps Tracker:
  - tabs (add/remove/select/rename)
  - tab-specific exercises
  - direct reps edits, +/- by step, step size changes, reset, delete, reorder
  - `All` combined exercises view
- Wake-up Tracker:
  - one entry per date (replace on duplicate date)
  - date+time form
  - chart with filter by all/month/year
  - point select + delete
  - reset to predefined seed data
  - manual Y-axis max cap with auto/reset
- Weight Tracker:
  - one entry per date (replace on duplicate date)
  - trend graph with raw line, moving average, linear trend line
- Daily Routine Tracker:
  - central study stopwatch (start/pause/reset, click-to-toggle, paused-only manual edit)
  - exactly 4 checklist tasks
  - timed task countdowns with start/pause/reset
  - pleasant sound + auto-complete when timer reaches zero

## Run (development)

1. Start PostgreSQL (Docker):
   - `docker compose up postgres`
2. Backend:
   - `python -m venv .venv`
   - `.venv\\Scripts\\activate`
   - `pip install -r backend/requirements.txt`
   - create `.env` in repo root (see `.env.example`)
   - `uvicorn backend.main:app --reload --port 8000`
3. Frontend (separate terminal):
   - `cd frontend`
   - `npm install`
   - create `frontend/.env` (see `frontend/.env.example`)
   - `npm run dev`
4. Open `http://localhost:5173`

## Run via Uvicorn (serve built React from FastAPI)

1. Build frontend:
   - `cd frontend`
   - `npm install`
   - `npm run build`
2. Ensure PostgreSQL is running:
   - `docker compose up postgres`
3. Start backend from repo root:
   - `uvicorn backend.main:app --reload --port 8000`
4. Open `http://localhost:8000`

## Google OAuth Setup

1. In Google Cloud Console, configure OAuth consent screen:
   - choose `External` (or `Internal` if using Workspace only)
   - add your app name/support email
   - add test users if app is in testing mode
2. Create OAuth Client ID (Web application).
3. Add Authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
   - `http://localhost:8000`
   - `http://127.0.0.1:8000`
4. Add backend and frontend env values:
   - repo `.env`:
     - `GOOGLE_CLIENT_ID=...apps.googleusercontent.com`
     - `ALLOWED_EMAILS=you@example.com,friend@example.com`
     - `SESSION_SECRET_KEY=<long-random-secret>`
   - `frontend/.env`:
     - `VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com`
5. Restart backend and frontend after env changes.

## Open on Mobile (same Wi-Fi)

1. Find your computer IPv4 address:
   - Windows: `ipconfig`
   - Use the `IPv4 Address` of your active Wi-Fi adapter (example: `192.168.1.23`)
2. Start server with LAN binding:
   - Uvicorn mode: `uvicorn backend.main:app --host 0.0.0.0 --port 8000`
   - Vite dev mode: `cd frontend && npm run dev -- --host 0.0.0.0 --port 5173`
3. Open from phone browser:
   - Uvicorn: `http://<your-ip>:8000`
   - Vite dev: `http://<your-ip>:5173`
4. If prompted, allow the app through Windows Firewall for Private networks.


