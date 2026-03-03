from __future__ import annotations

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.core.bootstrap import get_default_user
from backend.core.db import get_db
from backend.core.models import User
from backend.core.settings import AUTH_MODE


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    if AUTH_MODE == "dev_auto":
        user = get_default_user(db)
        request.session["user_id"] = user.id
        db.commit()
        return user

    user_id = request.session.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = db.scalar(select(User).where(User.id == int(user_id)))
    if user is None:
        request.session.clear()
        raise HTTPException(status_code=401, detail="Session user not found")

    return user
