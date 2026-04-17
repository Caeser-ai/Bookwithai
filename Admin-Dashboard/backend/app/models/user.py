from datetime import datetime

from sqlalchemy import ARRAY, Column, Date, String, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB

try:
    from app.db import BaseUser
except ImportError:
    from db import BaseUser


class User(BaseUser):
    __tablename__ = "users"

    id = Column(Text, primary_key=True)
    clerk_user_id = Column(Text, nullable=True)
    email = Column(Text, nullable=False, index=True)
    first_name = Column(Text, nullable=True)
    last_name = Column(Text, nullable=True)
    full_name = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    role = Column(Text, nullable=True, default="user")
    status = Column(Text, nullable=True, default="active")
    last_sign_in_at = Column(TIMESTAMP, nullable=True)
    deleted_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)
    phone = Column(Text, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(Text, nullable=True)
    nationality = Column(Text, nullable=True)
    address = Column(Text, nullable=True)


class TravelPreference(BaseUser):
    __tablename__ = "travel_preferences"

    id = Column(Text, primary_key=True)
    user_id = Column(Text, nullable=False, index=True)
    seat_preference = Column(String(50), nullable=True)
    meal_preference = Column(String(50), nullable=True)
    cabin_class = Column(String(50), nullable=True)
    preferred_airlines = Column(ARRAY(String), nullable=True)
    flight_timing = Column(ARRAY(String), nullable=True)
    travel_style = Column(Text, nullable=True)
    layover_preference = Column(Text, nullable=True)
    max_layover_time = Column(Text, nullable=True)
    airport_preference = Column(ARRAY(String), nullable=True)
    special_assistance = Column(Text, nullable=True)
    extra_preferences = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)
