from __future__ import annotations

from datetime import date, time

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

    reps_tabs: Mapped[list[RepTab]] = relationship(back_populates="user", cascade="all, delete-orphan")
    wakeup_entries: Mapped[list[WakeupEntry]] = relationship(back_populates="user", cascade="all, delete-orphan")
    weight_entries: Mapped[list[WeightEntry]] = relationship(back_populates="user", cascade="all, delete-orphan")
    routine_days: Mapped[list[RoutineDay]] = relationship(back_populates="user", cascade="all, delete-orphan")
    vocab_groups: Mapped[list[VocabGroup]] = relationship(back_populates="user", cascade="all, delete-orphan")
    vocab_english_words: Mapped[list[VocabEnglishWord]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    vocab_hebrew_words: Mapped[list[VocabHebrewWord]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class AllowedEmail(Base):
    __tablename__ = "allowed_emails"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class RepTab(Base):
    __tablename__ = "rep_tabs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    user: Mapped[User] = relationship(back_populates="reps_tabs")
    exercises: Mapped[list[RepExercise]] = relationship(back_populates="tab", cascade="all, delete-orphan")


class RepExercise(Base):
    __tablename__ = "rep_exercises"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    tab_id: Mapped[str] = mapped_column(ForeignKey("rep_tabs.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    reps: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    step: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    tab: Mapped[RepTab] = relationship(back_populates="exercises")


class WakeupEntry(Base):
    __tablename__ = "wakeup_entries"
    __table_args__ = (UniqueConstraint("user_id", "entry_date", name="uq_wakeup_user_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    wake_time: Mapped[time] = mapped_column(Time, nullable=False)

    user: Mapped[User] = relationship(back_populates="wakeup_entries")


class WeightEntry(Base):
    __tablename__ = "weight_entries"
    __table_args__ = (UniqueConstraint("user_id", "entry_date", name="uq_weight_user_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)

    user: Mapped[User] = relationship(back_populates="weight_entries")


class RoutineDay(Base):
    __tablename__ = "routine_days"
    __table_args__ = (UniqueConstraint("user_id", "entry_date", name="uq_routine_user_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    study_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    user: Mapped[User] = relationship(back_populates="routine_days")
    tasks: Mapped[list[RoutineTask]] = relationship(back_populates="routine_day", cascade="all, delete-orphan")


class RoutineTask(Base):
    __tablename__ = "routine_tasks"
    __table_args__ = (UniqueConstraint("routine_day_id", "task_id", name="uq_routine_day_task"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    routine_day_id: Mapped[int] = mapped_column(ForeignKey("routine_days.id", ondelete="CASCADE"), nullable=False)
    task_id: Mapped[str] = mapped_column(String(8), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    is_timed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    initial_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    remaining_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    routine_day: Mapped[RoutineDay] = relationship(back_populates="tasks")


class VocabGroup(Base):
    __tablename__ = "vocab_groups"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_vocab_group_user_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    user: Mapped[User] = relationship(back_populates="vocab_groups")
    packs: Mapped[list[VocabPack]] = relationship(back_populates="group", cascade="all, delete-orphan")


class VocabEnglishWord(Base):
    __tablename__ = "vocab_english_words"
    __table_args__ = (UniqueConstraint("user_id", "text", name="uq_vocab_english_user_text"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str] = mapped_column(String(100), nullable=False)

    user: Mapped[User] = relationship(back_populates="vocab_english_words")
    pack_links: Mapped[list[VocabPackEnglishWord]] = relationship(
        back_populates="english_word", cascade="all, delete-orphan"
    )


class VocabHebrewWord(Base):
    __tablename__ = "vocab_hebrew_words"
    __table_args__ = (UniqueConstraint("user_id", "text", name="uq_vocab_hebrew_user_text"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str] = mapped_column(String(100), nullable=False)

    user: Mapped[User] = relationship(back_populates="vocab_hebrew_words")
    pack_links: Mapped[list[VocabPackHebrewWord]] = relationship(
        back_populates="hebrew_word", cascade="all, delete-orphan"
    )


class VocabPack(Base):
    __tablename__ = "vocab_packs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("vocab_groups.id", ondelete="CASCADE"), nullable=False)

    group: Mapped[VocabGroup] = relationship(back_populates="packs")
    english_links: Mapped[list[VocabPackEnglishWord]] = relationship(
        back_populates="pack", cascade="all, delete-orphan"
    )
    hebrew_links: Mapped[list[VocabPackHebrewWord]] = relationship(
        back_populates="pack", cascade="all, delete-orphan"
    )


class VocabPackEnglishWord(Base):
    __tablename__ = "vocab_pack_english_words"
    __table_args__ = (
        UniqueConstraint(
            "pack_id",
            "english_word_id",
            name="uq_vocab_pack_english_word",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pack_id: Mapped[int] = mapped_column(ForeignKey("vocab_packs.id", ondelete="CASCADE"), nullable=False)
    english_word_id: Mapped[int] = mapped_column(
        ForeignKey("vocab_english_words.id", ondelete="CASCADE"), nullable=False
    )

    pack: Mapped[VocabPack] = relationship(back_populates="english_links")
    english_word: Mapped[VocabEnglishWord] = relationship(back_populates="pack_links")


class VocabPackHebrewWord(Base):
    __tablename__ = "vocab_pack_hebrew_words"
    __table_args__ = (
        UniqueConstraint(
            "pack_id",
            "hebrew_word_id",
            name="uq_vocab_pack_hebrew_word",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pack_id: Mapped[int] = mapped_column(ForeignKey("vocab_packs.id", ondelete="CASCADE"), nullable=False)
    hebrew_word_id: Mapped[int] = mapped_column(
        ForeignKey("vocab_hebrew_words.id", ondelete="CASCADE"), nullable=False
    )

    pack: Mapped[VocabPack] = relationship(back_populates="hebrew_links")
    hebrew_word: Mapped[VocabHebrewWord] = relationship(back_populates="pack_links")
