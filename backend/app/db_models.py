"""SQLAlchemy ORM table definitions."""

from sqlalchemy import BigInteger, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class UserRow(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    hashed_password: Mapped[bytes] = mapped_column(Text, nullable=False)

    tokens: Mapped[list["TokenRow"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    scores: Mapped[list["ScoreRow"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    active_game: Mapped["ActiveGameRow | None"] = relationship(back_populates="user", cascade="all, delete-orphan", uselist=False)


class TokenRow(Base):
    __tablename__ = "tokens"

    token: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)

    user: Mapped["UserRow"] = relationship(back_populates="tokens")


class ScoreRow(Base):
    __tablename__ = "scores"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    username: Mapped[str] = mapped_column(String, nullable=False)
    mode: Mapped[str] = mapped_column(String, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[int] = mapped_column(BigInteger, nullable=False)

    user: Mapped["UserRow"] = relationship(back_populates="scores")


class ActiveGameRow(Base):
    __tablename__ = "active_games"

    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), primary_key=True)
    username: Mapped[str] = mapped_column(String, nullable=False)
    mode: Mapped[str] = mapped_column(String, nullable=False)
    # GameState serialised as JSON
    state_json: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[int] = mapped_column(BigInteger, nullable=False)

    user: Mapped["UserRow"] = relationship(back_populates="active_game")
