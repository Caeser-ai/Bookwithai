"""Admin authentication model for the admin dashboard."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, Text, TIMESTAMP

from database import BaseUser


class AdminUser(BaseUser):
    __tablename__ = "admin_users"

    id = Column(Text, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(Text, unique=True, nullable=False, index=True)
    email = Column(Text, unique=True, nullable=False, index=True)
    full_name = Column(Text, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(Text, nullable=False, default="super_admin")
    is_active = Column(Boolean, nullable=False, default=True)
    last_login_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
