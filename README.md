# PolyApp

PolyApp is a browser-based mini-app hub for personal tracking tools.

## Stack

- Frontend: React + TypeScript + Tailwind CSS + Recharts
- Backend: FastAPI microservices (reps, wake-up, weight, routine)
- Serving: `uvicorn` for backend APIs; can also serve built React app from FastAPI

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

1. Backend:
   - `python -m venv .venv`
   - `.venv\\Scripts\\activate`
   - `pip install -r backend/requirements.txt`
   - `uvicorn backend.main:app --reload --port 8000`
2. Frontend (separate terminal):
   - `cd frontend`
   - `npm install`
   - `npm run dev`
3. Open `http://localhost:5173`

## Run via Uvicorn (serve built React from FastAPI)

1. Build frontend:
   - `cd frontend`
   - `npm install`
   - `npm run build`
2. Start backend from repo root:
   - `uvicorn backend.main:app --reload --port 8000`
3. Open `http://localhost:8000`

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
