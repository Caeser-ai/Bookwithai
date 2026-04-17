from datetime import datetime

from sqlalchemy import Boolean, Column, Integer, Numeric, String, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB, UUID

try:
    from app.db import BaseUser
except ImportError:
    from db import BaseUser


class Trip(BaseUser):
    __tablename__ = "trips"

    id = Column(Text, primary_key=True)
    user_id = Column(Text, nullable=True, index=True)
    airline_name = Column(Text, nullable=True)
    origin_code = Column(Text, nullable=True)
    origin_label = Column(Text, nullable=True)
    destination_code = Column(Text, nullable=True)
    destination_label = Column(Text, nullable=True)
    departure_at = Column(TIMESTAMP, nullable=True)
    arrival_at = Column(TIMESTAMP, nullable=True)
    status = Column(Text, nullable=True, default="confirmed")
    cabin_class = Column(Text, nullable=True)
    booking_reference = Column(Text, nullable=True)
    booking_reference_last4 = Column(Text, nullable=True)
    confirmation_code = Column(Text, nullable=True)
    confirmation_code_last4 = Column(Text, nullable=True)
    ticket_number = Column(Text, nullable=True)
    ticket_number_last4 = Column(Text, nullable=True)
    seat_number = Column(Text, nullable=True)
    ticket_cost_minor = Column(Integer, nullable=True)
    currency_code = Column(Text, nullable=True, default="INR")
    flight_snapshot = Column(JSONB, nullable=True)
    last_synced_at = Column(TIMESTAMP, nullable=True)
    flight_number = Column(Text, nullable=True)
    duration = Column(String(20), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)


class PriceAlert(BaseUser):
    __tablename__ = "price_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(String(255), nullable=False, index=True)
    origin = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    airline = Column(String(100), nullable=True)
    date_range = Column(String(50), nullable=True)
    current_price = Column(Numeric, nullable=True)
    lowest_price = Column(Numeric, nullable=True)
    currency = Column(String(10), nullable=True)
    trend = Column(String(20), nullable=True)
    change_pct = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)


class Feedback(BaseUser):
    __tablename__ = "feedback"

    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(String(255), nullable=True, index=True)
    session_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    message = Column(Text, nullable=False)
    context_chat = Column(JSONB, nullable=True)
    context_flights = Column(JSONB, nullable=True)
    context_page = Column(JSONB, nullable=True)
    status = Column(String(20), nullable=False, default="new")
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)
