import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    user_database_url: str
    chat_database_url: str
    admin_token: str
    db_pool_recycle: int
    db_pool_pre_ping: bool


def _to_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def load_settings() -> Settings:
    default_db = os.getenv("DATABASE_URL", "").strip()
    user_db = (os.getenv("USER_DATABASE_URL") or default_db).strip()
    chat_db = (os.getenv("CHAT_DATABASE_URL") or user_db or default_db).strip()
    admin_token = os.getenv("ADMIN_TOKEN", "").strip()

    if not user_db:
        raise RuntimeError("USER_DATABASE_URL or DATABASE_URL must be set.")
    if not chat_db:
        raise RuntimeError("CHAT_DATABASE_URL or DATABASE_URL must be set.")
    if not admin_token:
        raise RuntimeError("ADMIN_TOKEN must be set.")

    return Settings(
        user_database_url=user_db,
        chat_database_url=chat_db,
        admin_token=admin_token,
        db_pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "1800")),
        db_pool_pre_ping=_to_bool(os.getenv("DB_POOL_PRE_PING"), True),
    )


settings = load_settings()

