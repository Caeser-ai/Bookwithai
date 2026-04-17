from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import declarative_base, sessionmaker

try:
    from app.config import settings
except ImportError:
    from config import settings

engine_user = create_engine(
    settings.user_database_url,
    echo=False,
    pool_pre_ping=settings.db_pool_pre_ping,
    pool_recycle=settings.db_pool_recycle,
)
engine_chat = create_engine(
    settings.chat_database_url,
    echo=False,
    pool_pre_ping=settings.db_pool_pre_ping,
    pool_recycle=settings.db_pool_recycle,
)

SessionUser = sessionmaker(autocommit=False, autoflush=False, bind=engine_user)
SessionChat = sessionmaker(autocommit=False, autoflush=False, bind=engine_chat)

BaseUser = declarative_base()
BaseChat = declarative_base()


def _safe_close_session(db) -> None:
    try:
        db.close()
    except DBAPIError:
        pass


def get_user_db() -> Generator:
    db = SessionUser()
    try:
        yield db
    finally:
        _safe_close_session(db)


def get_chat_db() -> Generator:
    db = SessionChat()
    try:
        yield db
    finally:
        _safe_close_session(db)

