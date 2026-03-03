from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.core.auth import get_current_user
from backend.core.db import get_db
from backend.core.models import AllowedEmail, User
from backend.core.settings import AUTH_MODE, GOOGLE_CLIENT_ID

router = APIRouter(prefix="/api/auth", tags=["auth"])


class GoogleCredentialPayload(BaseModel):
    credential: str = Field(min_length=20)


def _is_email_allowed(db: Session, email: str) -> bool:
    allowed_count = db.scalar(select(AllowedEmail.id).limit(1))
    if allowed_count is None:
        return False

    allowed = db.scalar(
        select(AllowedEmail).where(
            AllowedEmail.email == email.lower(),
            AllowedEmail.is_active.is_(True),
        )
    )
    return allowed is not None


@router.get("/me")
def me(current_user: User = Depends(get_current_user)) -> dict:
    return {
        "authenticated": True,
        "authMode": AUTH_MODE,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
        },
    }


@router.post("/google")
def login_with_google(
    payload: GoogleCredentialPayload,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    if AUTH_MODE == "dev_auto":
        raise HTTPException(status_code=409, detail="Google login is disabled in AUTH_MODE=dev_auto")

    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID is not configured")

    try:
        token_info = id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Invalid Google token") from exc

    email = str(token_info.get("email", "")).lower().strip()
    email_verified = bool(token_info.get("email_verified"))
    subject = str(token_info.get("sub", "")).strip()

    if not email or not email_verified or not subject:
        raise HTTPException(status_code=401, detail="Google token missing required claims")

    if not _is_email_allowed(db, email):
        raise HTTPException(status_code=403, detail="Email is not in the allowed list")

    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(username=f"google_{subject[:40]}", email=email)
        db.add(user)
        db.flush()

    request.session["user_id"] = user.id
    db.commit()

    return {
        "authenticated": True,
        "authMode": AUTH_MODE,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
        },
    }


@router.post("/logout")
def logout(request: Request) -> dict:
    request.session.clear()
    return {"ok": True}
