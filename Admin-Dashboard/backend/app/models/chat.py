import uuid
from datetime import datetime

from sqlalchemy import Column, ForeignKey, String, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB, UUID

try:
    from app.db import BaseChat
except ImportError:
    from db import BaseChat


class ChatSession(BaseChat):
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    title = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)


class ChatMessage(BaseChat):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    msg_type = Column(String(20), nullable=True, default="text")
    metadata_ = Column("metadata", JSONB, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

