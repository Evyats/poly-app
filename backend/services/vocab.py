from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from backend.core.auth import get_current_user
from backend.core.db import get_db
from backend.core.models import (
    User,
    VocabEnglishWord,
    VocabGroup,
    VocabHebrewWord,
    VocabPack,
    VocabPackEnglishWord,
    VocabPackHebrewWord,
)

router = APIRouter(prefix="/api/vocab", tags=["vocab"])


class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class GroupRename(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class PackCreate(BaseModel):
    englishWords: list[str] = Field(min_length=1)
    hebrewWords: list[str] = Field(min_length=1)

    @field_validator("englishWords", "hebrewWords", mode="before")
    @classmethod
    def strip_and_validate_words(cls, value: object) -> list[str]:
        if not isinstance(value, list):
            raise ValueError("Must be a list")
        cleaned = []
        for item in value:
            text = str(item).strip()
            if text:
                cleaned.append(text)
        unique = list(dict.fromkeys(cleaned))
        if not unique:
            raise ValueError("At least one word is required")
        return unique



def _groups_payload(db: Session, user: User) -> dict:
    rows = db.execute(
        select(VocabGroup.id, VocabGroup.name, func.count(VocabPack.id))
        .outerjoin(VocabPack, VocabPack.group_id == VocabGroup.id)
        .where(VocabGroup.user_id == user.id)
        .group_by(VocabGroup.id, VocabGroup.name)
        .order_by(VocabGroup.name)
    ).all()
    return {
        "groups": [
            {
                "id": row[0],
                "name": row[1],
                "packCount": row[2],
            }
            for row in rows
        ]
    }



def _group_detail_payload(db: Session, group: VocabGroup) -> dict:
    result = db.execute(
        select(VocabPack)
        .options(
            joinedload(VocabPack.english_links).joinedload(VocabPackEnglishWord.english_word),
            joinedload(VocabPack.hebrew_links).joinedload(VocabPackHebrewWord.hebrew_word),
        )
        .where(VocabPack.group_id == group.id)
        .order_by(VocabPack.id)
    )
    packs = list(result.unique().scalars())
    return {
        "group": {"id": group.id, "name": group.name},
        "packs": [
            {
                "id": pack.id,
                "englishWords": [link.english_word.text for link in pack.english_links],
                "hebrewWords": [link.hebrew_word.text for link in pack.hebrew_links],
            }
            for pack in packs
        ],
    }



def _user_group_or_404(db: Session, user: User, group_id: int) -> VocabGroup:
    group = db.scalar(select(VocabGroup).where(VocabGroup.id == group_id, VocabGroup.user_id == user.id))
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.get("/groups")
def list_groups(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    return _groups_payload(db, user)


@router.post("/groups")
def create_group(
    payload: GroupCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    db.add(VocabGroup(user_id=user.id, name=payload.name.strip()))
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Group name already exists") from exc
    return _groups_payload(db, user)


@router.patch("/groups/{group_id}")
def rename_group(
    group_id: int,
    payload: GroupRename,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    group = _user_group_or_404(db, user, group_id)
    group.name = payload.name.strip()
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Group name already exists") from exc
    return _groups_payload(db, user)


@router.delete("/groups/{group_id}")
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    group = _user_group_or_404(db, user, group_id)
    db.delete(group)
    db.commit()
    return _groups_payload(db, user)


@router.get("/groups/{group_id}")
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    group = _user_group_or_404(db, user, group_id)
    return _group_detail_payload(db, group)


@router.post("/groups/{group_id}/packs")
def create_pack(
    group_id: int,
    payload: PackCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    group = _user_group_or_404(db, user, group_id)

    pack = VocabPack(group_id=group.id)
    db.add(pack)
    db.flush()

    for english_text in payload.englishWords:
        english_word = db.scalar(
            select(VocabEnglishWord).where(
                VocabEnglishWord.user_id == user.id,
                VocabEnglishWord.text == english_text,
            )
        )
        if english_word is None:
            english_word = VocabEnglishWord(user_id=user.id, text=english_text)
            db.add(english_word)
            db.flush()

        db.add(VocabPackEnglishWord(pack_id=pack.id, english_word_id=english_word.id))

    for hebrew_text in payload.hebrewWords:
        hebrew_word = db.scalar(
            select(VocabHebrewWord).where(
                VocabHebrewWord.user_id == user.id,
                VocabHebrewWord.text == hebrew_text,
            )
        )
        if hebrew_word is None:
            hebrew_word = VocabHebrewWord(user_id=user.id, text=hebrew_text)
            db.add(hebrew_word)
            db.flush()

        db.add(VocabPackHebrewWord(pack_id=pack.id, hebrew_word_id=hebrew_word.id))

    db.commit()
    return _group_detail_payload(db, group)


@router.delete("/groups/{group_id}/packs/{pack_id}")
def delete_pack(
    group_id: int,
    pack_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    group = _user_group_or_404(db, user, group_id)
    pack = db.scalar(select(VocabPack).where(VocabPack.id == pack_id, VocabPack.group_id == group.id))
    if pack is None:
        raise HTTPException(status_code=404, detail="Pack not found")

    db.delete(pack)
    db.commit()
    return _group_detail_payload(db, group)
