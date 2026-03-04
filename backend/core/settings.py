from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _to_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower() or "development"
if ENVIRONMENT not in {"development", "production"}:
    ENVIRONMENT = "development"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://polyapp:polyapp@localhost:5433/polyapp")

SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY", "").strip()
if not SESSION_SECRET_KEY:
    raise RuntimeError("SESSION_SECRET_KEY must be set in environment (.env)")

SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "polyapp_session").strip() or "polyapp_session"
SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "lax").strip().lower() or "lax"
if SESSION_COOKIE_SAMESITE not in {"lax", "strict", "none"}:
    SESSION_COOKIE_SAMESITE = "lax"
SESSION_COOKIE_SECURE = _to_bool(
    os.getenv("SESSION_COOKIE_SECURE"),
    default=(ENVIRONMENT == "production"),
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
ALLOWED_EMAILS = [email.lower() for email in _split_csv(os.getenv("ALLOWED_EMAILS", ""))]
CORS_ORIGINS = _split_csv(
    os.getenv(
        "CORS_ORIGINS",
        "http://localhost:4173,http://127.0.0.1:4173,http://localhost:8765,http://127.0.0.1:8765",
    )
)

AUTH_MODE = os.getenv("AUTH_MODE", "oauth").strip().lower()
if AUTH_MODE not in {"oauth", "dev_auto"}:
    AUTH_MODE = "oauth"

DEFAULT_APP_USERNAME = os.getenv("DEFAULT_APP_USERNAME", "local_dev_user").strip() or "local_dev_user"
DEFAULT_APP_EMAIL = (
    os.getenv("DEFAULT_APP_EMAIL", "local.dev.user@example.com").strip().lower()
    or "local.dev.user@example.com"
)


