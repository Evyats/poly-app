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
