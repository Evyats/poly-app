from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://polyapp:polyapp@localhost:5433/polyapp")
SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY", "dev-session-secret-change-me")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
ALLOWED_EMAILS = [email.lower() for email in _split_csv(os.getenv("ALLOWED_EMAILS", ""))]
CORS_ORIGINS = _split_csv(
    os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000",
    )
)

AUTH_MODE = os.getenv("AUTH_MODE", "oauth").strip().lower()
if AUTH_MODE not in {"oauth", "dev_auto"}:
    AUTH_MODE = "oauth"

DEFAULT_APP_USERNAME = os.getenv("DEFAULT_APP_USERNAME", "evyats").strip() or "evyats"
DEFAULT_APP_EMAIL = os.getenv("DEFAULT_APP_EMAIL", "").strip().lower() or None
