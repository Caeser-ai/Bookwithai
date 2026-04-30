"""Simple admin auth helpers for the admin dashboard."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Any

import jwt
from passlib.context import CryptContext
from sqlalchemy import text

from database import engine_user


ADMIN_ROLE_SUPER_ADMIN = "super_admin"
ADMIN_JWT_ALGORITHM = "HS256"
ADMIN_JWT_SECRET = (
    os.getenv("ADMIN_JWT_SECRET")
    or os.getenv("JWT_SECRET")
    or os.getenv("JWT_SECRET_KEY")
    or os.getenv("ADMIN_TOKEN")
    or ""
)
ADMIN_JWT_EXPIRES_HOURS = max(int(os.getenv("ADMIN_JWT_EXPIRES_HOURS", "24") or 24), 1)

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_ADMIN_READY = False
_ADMIN_LOCK = Lock()


def ensure_admin_auth_infra() -> None:
    global _ADMIN_READY
    if _ADMIN_READY or engine_user is None:
        return

    with _ADMIN_LOCK:
        if _ADMIN_READY or engine_user is None:
            return

        with engine_user.begin() as conn:
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS admin_users (
                      id TEXT PRIMARY KEY,
                      username TEXT NOT NULL UNIQUE,
                      email TEXT NOT NULL UNIQUE,
                      full_name TEXT NOT NULL,
                      password_hash TEXT NOT NULL,
                      role TEXT NOT NULL DEFAULT 'super_admin',
                      is_active BOOLEAN NOT NULL DEFAULT TRUE,
                      last_login_at TIMESTAMP NULL,
                      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
            )
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users (username)")
            )
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email)")
            )
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users (role)")
            )

        _ADMIN_READY = True


def normalize_admin_username(value: str | None) -> str:
    return "".join((value or "").strip().lower().split())


def normalize_admin_email(value: str | None) -> str:
    return (value or "").strip().lower()


def hash_admin_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_admin_password(plain_password: str, hashed_password: str) -> bool:
    return _pwd_context.verify(plain_password, hashed_password)


def create_admin_access_token(*, admin_id: str, username: str, role: str) -> str:
    if not ADMIN_JWT_SECRET:
        raise RuntimeError("ADMIN_JWT_SECRET or JWT_SECRET must be configured for admin auth.")

    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": admin_id,
        "scope": "admin",
        "username": username,
        "role": role,
        "iat": now,
        "exp": now + timedelta(hours=ADMIN_JWT_EXPIRES_HOURS),
    }
    return jwt.encode(payload, ADMIN_JWT_SECRET, algorithm=ADMIN_JWT_ALGORITHM)


def decode_admin_access_token(token: str) -> dict[str, Any]:
    if not ADMIN_JWT_SECRET:
        raise RuntimeError("ADMIN_JWT_SECRET or JWT_SECRET must be configured for admin auth.")

    payload = jwt.decode(
        token,
        ADMIN_JWT_SECRET,
        algorithms=[ADMIN_JWT_ALGORITHM],
        options={"verify_exp": True},
    )
    if payload.get("scope") != "admin":
        raise jwt.InvalidTokenError("Invalid admin token scope")
    return payload
