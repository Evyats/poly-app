from __future__ import annotations

import mimetypes
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import ProgrammingError
from starlette.middleware.sessions import SessionMiddleware

from backend.core.bootstrap import seed_default_data
from backend.core.db import wait_for_db
from backend.core.logging_config import setup_logging
from backend.core.settings import (
    CORS_ORIGINS,
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_SAMESITE,
    SESSION_COOKIE_SECURE,
    SESSION_SECRET_KEY,
)
from backend.services.auth import router as auth_router
from backend.services.reps import router as reps_router
from backend.services.routine import router as routine_router
from backend.services.vocab import router as vocab_router
from backend.services.wakeup import router as wakeup_router
from backend.services.weight import router as weight_router

# Windows can resolve .js to text/plain; force module-safe MIME types.
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".mjs")
setup_logging()


@asynccontextmanager
async def lifespan(_: FastAPI):
    wait_for_db()
    try:
        seed_default_data()
    except ProgrammingError as exc:
        raise RuntimeError("Database schema missing. Run: alembic upgrade head") from exc
    yield


app = FastAPI(title="PolyApp API", lifespan=lifespan)
app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET_KEY,
    same_site=SESSION_COOKIE_SAMESITE,
    https_only=SESSION_COOKIE_SECURE,
    session_cookie=SESSION_COOKIE_NAME,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


app.include_router(auth_router)
app.include_router(reps_router)
app.include_router(wakeup_router)
app.include_router(weight_router)
app.include_router(routine_router)
app.include_router(vocab_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


frontend_dist = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str) -> FileResponse:
        requested = frontend_dist / full_path
        if full_path and requested.exists() and requested.is_file():
            return FileResponse(requested)
        return FileResponse(frontend_dist / "index.html")
