import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

try:
    from app.config import settings
    from app.db import get_chat_db, get_user_db
    from app.models.chat import ChatMessage, ChatSession
    from app.models.travel import Feedback, PriceAlert, Trip
    from app.models.user import TravelPreference, User
except ImportError:
    from config import settings
    from db import get_chat_db, get_user_db
    from models.chat import ChatMessage, ChatSession
    from models.travel import Feedback, PriceAlert, Trip
    from models.user import TravelPreference, User

router = APIRouter(prefix="/api/admin", tags=["admin-lite"])


def require_admin(x_admin_token: str = Header(default="")) -> None:
    if not settings.admin_token or x_admin_token != settings.admin_token:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _iso_datetime(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value else None


def _start_of_day(value: datetime) -> datetime:
    return datetime(value.year, value.month, value.day)


def _build_recent_day_keys(days: int = 7) -> list[datetime]:
    today = datetime.utcnow()
    return [_start_of_day(today - timedelta(days=offset)) for offset in reversed(range(days))]


def _normalize_admin_label(value: Any, fallback: str = "Unknown") -> str:
    if value is None:
        return fallback
    if isinstance(value, list):
        cleaned = [str(item).strip() for item in value if str(item).strip()]
        return ", ".join(cleaned) if cleaned else fallback
    text_value = str(value).strip()
    return text_value or fallback


def _first_list_value(value: Any, fallback: str = "Unknown") -> str:
    if isinstance(value, list):
        for item in value:
            normalized = _normalize_admin_label(item, "")
            if normalized:
                return normalized
        return fallback
    return _normalize_admin_label(value, fallback)


def _coalesce_attr(obj: Any, *names: str, default: Any = None) -> Any:
    for name in names:
        if not hasattr(obj, name):
            continue
        value = getattr(obj, name)
        if value not in (None, "", []):
            return value
    return default


def _is_search_message(message: ChatMessage) -> bool:
    content = message.content or ""
    return "<FLIGHT_SEARCH>" in content or message.msg_type == "flights"


def _is_redirect_message(message: ChatMessage) -> bool:
    content = (message.content or "").lower()
    return any(
        host in content
        for host in (
            "skyscanner.com",
            "kayak.com",
            "google.com/travel/flights",
            "expedia.com",
            "booking.com/flights",
        )
    )


def _profile_completion_percent(user: User, preference: Optional[TravelPreference]) -> int:
    fields = [
        _coalesce_attr(user, "first_name", "full_name"),
        _coalesce_attr(user, "last_name", "full_name"),
        getattr(user, "phone", None),
        getattr(user, "date_of_birth", None),
        getattr(user, "gender", None),
        getattr(user, "nationality", None),
        getattr(user, "address", None),
        _coalesce_attr(user, "image_url", "avatar_url"),
        preference.seat_preference if preference else None,
        preference.cabin_class if preference else None,
    ]
    completed = sum(1 for field in fields if field not in (None, "", []))
    return round((completed / len(fields)) * 100)


def _build_bucket_counts(values: list[int], buckets: list[tuple[str, int, Optional[int]]]) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    for label, minimum, maximum in buckets:
        if maximum is None:
            count = sum(1 for value in values if value >= minimum)
        else:
            count = sum(1 for value in values if minimum <= value <= maximum)
        output.append({"label": label, "count": count})
    return output


def _format_route_label(origin: Optional[str], destination: Optional[str]) -> str:
    left = _normalize_admin_label(origin, "Unknown origin")
    right = _normalize_admin_label(destination, "Unknown destination")
    return f"{left} -> {right}"


_IATA_PAIR_ROUTE_RE = re.compile(r"\b([A-Z]{3})\s*(?:-|to|->)\s*([A-Z]{3})\b")


def _route_label_from_flight_metadata(metadata: Any) -> Optional[str]:
    if not isinstance(metadata, dict):
        return None
    search = metadata.get("search") or {}
    origin = (search.get("origin") or "").strip()
    destination = (search.get("destination") or "").strip()
    if origin and destination:
        return _format_route_label(origin, destination)
    for key in ("flights", "all_flights"):
        flights = metadata.get(key)
        if isinstance(flights, list) and flights:
            first = flights[0]
            if isinstance(first, dict):
                route = first.get("route") or {}
                origin = (route.get("originCity") or route.get("originIata") or "").strip()
                destination = (route.get("destinationCity") or route.get("destinationIata") or "").strip()
                if origin or destination:
                    return _format_route_label(origin or None, destination or None)
    return None


def _short_prompt(content: str, limit: int = 80) -> str:
    normalized = re.sub(r"\s+", " ", (content or "").strip())
    if len(normalized) <= limit:
        return normalized
    return normalized[: limit - 3].rstrip() + "..."


def _build_admin_data_context(db_user: Session, db_chat: Session) -> dict[str, Any]:
    users_query = db_user.query(User)
    deleted_at_column = getattr(User, "deleted_at", None)
    if deleted_at_column is not None:
        users_query = users_query.filter(deleted_at_column.is_(None))
    users = users_query.order_by(User.created_at.desc()).all()
    known_user_ids = {str(user.id) for user in users}
    preferences = db_user.query(TravelPreference).all()
    trips = db_user.query(Trip).all()
    alerts = db_user.query(PriceAlert).all()
    feedback_items = db_user.query(Feedback).all()
    chat_sessions = db_chat.query(ChatSession).all()
    chat_messages = db_chat.query(ChatMessage).order_by(ChatMessage.created_at.asc()).all()

    preference_by_user = {str(pref.user_id): pref for pref in preferences}
    session_messages: dict[str, list[ChatMessage]] = defaultdict(list)
    session_search_counts: Counter[str] = Counter()
    redirect_message_count = 0
    total_searches = 0
    total_options = 0
    prompt_counter: Counter[str] = Counter()
    search_route_counter: Counter[str] = Counter()
    messages_last_24h = 0
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)

    for message in chat_messages:
        session_key = str(message.session_id)
        session_messages[session_key].append(message)

        if _is_search_message(message):
            session_search_counts[session_key] += 1
            total_searches += 1
        if message.msg_type == "flights":
            total_options += 1
            route_label = _route_label_from_flight_metadata(message.metadata_)
            if not route_label and message.content:
                pair = _IATA_PAIR_ROUTE_RE.search(message.content)
                if pair:
                    route_label = f"{pair.group(1)} -> {pair.group(2)}"
            if route_label:
                search_route_counter[route_label] += 1
        if _is_redirect_message(message):
            redirect_message_count += 1
        if message.role == "user":
            prompt = _short_prompt(message.content or "")
            if len(prompt) >= 8:
                prompt_counter[prompt] += 1
        if message.created_at and message.created_at >= twenty_four_hours_ago:
            messages_last_24h += 1

    trip_counts: Counter[str] = Counter()
    alert_counts: Counter[str] = Counter()
    feedback_counts: Counter[str] = Counter()
    route_counter: Counter[str] = Counter()
    for trip in trips:
        if trip.user_id:
            trip_counts[str(trip.user_id)] += 1
        route_counter[
            _format_route_label(
                _coalesce_attr(trip, "origin_label", "origin_code"),
                _coalesce_attr(trip, "destination_label", "destination_code"),
            )
        ] += 1
    for alert in alerts:
        if alert.user_id:
            alert_counts[str(alert.user_id)] += 1
    for item in feedback_items:
        if item.user_id:
            feedback_counts[str(item.user_id)] += 1

    user_session_count: Counter[str] = Counter()
    user_message_count: Counter[str] = Counter()
    user_search_count: Counter[str] = Counter()
    user_last_active: dict[str, datetime] = {}
    active_user_ids_30d: set[str] = set()
    authenticated_session_count = 0
    guest_session_count = 0
    one_month_ago = datetime.utcnow() - timedelta(days=30)
    session_metrics: list[dict[str, Any]] = []

    for session in chat_sessions:
        session_key = str(session.id)
        messages = session_messages.get(session_key, [])
        session_user_id = str(session.user_id) if session.user_id else None
        message_count = len(messages)
        search_count = session_search_counts.get(session_key, 0)
        duration_seconds = 0
        if session.created_at and session.updated_at and session.updated_at >= session.created_at:
            duration_seconds = int((session.updated_at - session.created_at).total_seconds())
        last_message_preview = (messages[-1].content or "").strip()[:120] if messages else ""

        session_metrics.append(
            {
                "id": session_key,
                "user_id": session_user_id,
                "created_at": session.created_at,
                "updated_at": session.updated_at,
                "message_count": message_count,
                "search_count": search_count,
                "duration_seconds": duration_seconds,
                "last_message_preview": last_message_preview,
            }
        )

        if session_user_id:
            authenticated_session_count += 1
            if session_user_id in known_user_ids:
                user_session_count[session_user_id] += 1
                user_message_count[session_user_id] += message_count
                user_search_count[session_user_id] += search_count
                if session.updated_at:
                    prior = user_last_active.get(session_user_id)
                    if not prior or session.updated_at > prior:
                        user_last_active[session_user_id] = session.updated_at
                    if session.updated_at >= one_month_ago:
                        active_user_ids_30d.add(session_user_id)
        else:
            guest_session_count += 1

    user_rows: list[dict[str, Any]] = []
    country_counter: Counter[str] = Counter()
    gender_counter: Counter[str] = Counter()
    role_counter: Counter[str] = Counter()
    status_counter: Counter[str] = Counter()
    cabin_counter: Counter[str] = Counter()
    seat_counter: Counter[str] = Counter()
    timing_counter: Counter[str] = Counter()

    for user in users:
        user_id = str(user.id)
        preference = preference_by_user.get(user_id)
        profile_completion = _profile_completion_percent(user, preference)
        session_count = user_session_count.get(user_id, 0)
        message_count = user_message_count.get(user_id, 0)
        search_count = user_search_count.get(user_id, 0)
        trip_count = trip_counts.get(user_id, 0)
        alert_count = alert_counts.get(user_id, 0)
        feedback_count = feedback_counts.get(user_id, 0)
        last_active_at = (
            user_last_active.get(user_id)
            or getattr(user, "last_sign_in_at", None)
            or getattr(user, "updated_at", None)
        )
        if last_active_at and last_active_at >= one_month_ago:
            active_user_ids_30d.add(user_id)

        engagement_score = min(
            100,
            int(
                min(session_count * 12, 24)
                + min(message_count * 1.5, 22)
                + min(search_count * 6, 18)
                + min(trip_count * 10, 16)
                + min(alert_count * 8, 10)
                + min(feedback_count * 4, 6)
                + round(profile_completion * 0.04)
            ),
        )
        country_label = _normalize_admin_label(getattr(user, "nationality", None))
        gender_label = _normalize_admin_label(getattr(user, "gender", None))
        role_label = _normalize_admin_label(getattr(user, "role", None), "User")
        status_label = _normalize_admin_label(getattr(user, "status", None), "Active")
        cabin_label = _normalize_admin_label(preference.cabin_class if preference else None)
        seat_label = _normalize_admin_label(preference.seat_preference if preference else None)
        timing_label = _first_list_value(
            getattr(preference, "flight_timing", None) if preference else None,
            "Unknown",
        )

        country_counter[country_label] += 1
        gender_counter[gender_label] += 1
        role_counter[role_label] += 1
        status_counter[status_label] += 1
        cabin_counter[cabin_label] += 1
        seat_counter[seat_label] += 1
        timing_counter[timing_label] += 1

        full_name = (
            f"{(getattr(user, 'first_name', '') or '').strip()} {(getattr(user, 'last_name', '') or '').strip()}".strip()
            or _normalize_admin_label(getattr(user, "full_name", None), "")
            or user.email
        )
        user_rows.append(
            {
                "id": user_id,
                "name": full_name,
                "email": user.email,
                "nationality": None if country_label == "Unknown" else country_label,
                "gender": None if gender_label == "Unknown" else gender_label,
                "role": role_label,
                "status": status_label,
                "created_at": _iso_datetime(user.created_at),
                "last_active_at": _iso_datetime(last_active_at),
                "session_count": session_count,
                "message_count": message_count,
                "search_count": search_count,
                "trip_count": trip_count,
                "alert_count": alert_count,
                "feedback_count": feedback_count,
                "profile_completion": profile_completion,
                "engagement_score": engagement_score,
                "cabin_class": None if cabin_label == "Unknown" else cabin_label,
                "seat_preference": None if seat_label == "Unknown" else seat_label,
                "flight_timing": None if timing_label == "Unknown" else timing_label,
            }
        )

    user_rows.sort(key=lambda item: (item["last_active_at"] or "", item["created_at"] or ""), reverse=True)

    recent_days = _build_recent_day_keys(7)
    new_users_daily: Counter[str] = Counter()
    active_users_daily: dict[str, set[str]] = defaultdict(set)
    sessions_daily: Counter[str] = Counter()
    searches_daily: Counter[str] = Counter()
    redirects_daily: Counter[str] = Counter()
    options_daily: Counter[str] = Counter()
    trips_daily: Counter[str] = Counter()

    for user in users:
        if user.created_at:
            new_users_daily[_start_of_day(user.created_at).date().isoformat()] += 1
        last_sign_in_at = getattr(user, "last_sign_in_at", None)
        if last_sign_in_at:
            active_users_daily[_start_of_day(last_sign_in_at).date().isoformat()].add(str(user.id))
    for session in chat_sessions:
        if session.created_at:
            sessions_daily[_start_of_day(session.created_at).date().isoformat()] += 1
        if session.updated_at and session.user_id:
            active_users_daily[_start_of_day(session.updated_at).date().isoformat()].add(str(session.user_id))
    for message in chat_messages:
        if not message.created_at:
            continue
        day_key = _start_of_day(message.created_at).date().isoformat()
        if _is_search_message(message):
            searches_daily[day_key] += 1
            if message.msg_type == "flights":
                options_daily[day_key] += 1
        if _is_redirect_message(message):
            redirects_daily[day_key] += 1
    for trip in trips:
        if trip.created_at:
            trips_daily[_start_of_day(trip.created_at).date().isoformat()] += 1

    growth_7d = []
    for day in recent_days:
        key = day.date().isoformat()
        growth_7d.append(
            {
                "date": key,
                "new_users": new_users_daily.get(key, 0),
                "active_users": len(active_users_daily.get(key, set())),
                "sessions": sessions_daily.get(key, 0),
                "searches": searches_daily.get(key, 0),
            }
        )

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "totals": {
            "total_users": len(users),
            "active_users_last_30d": len(active_user_ids_30d),
            "inactive_users_last_30d": max(len(users) - len(active_user_ids_30d), 0),
            "new_users_last_7d": sum(1 for user in users if user.created_at and user.created_at >= datetime.utcnow() - timedelta(days=7)),
            "new_users_last_30d": sum(1 for user in users if user.created_at and user.created_at >= one_month_ago),
            "users_with_feedback": len([uid for uid, count in feedback_counts.items() if count > 0]),
            "users_with_trips": len([uid for uid, count in trip_counts.items() if count > 0]),
            "users_with_alerts": len([uid for uid, count in alert_counts.items() if count > 0]),
            "authenticated_sessions": authenticated_session_count,
            "guest_sessions": guest_session_count,
            "avg_searches_per_user": round(total_searches / len(users), 2) if users else 0,
            "avg_messages_per_session": round(len(chat_messages) / len(chat_sessions), 2) if chat_sessions else 0,
            "avg_sessions_per_user": round(sum(user_session_count.values()) / len(users), 2) if users else 0,
            "messages_last_24h": messages_last_24h,
            "total_searches": total_searches,
            "total_options": total_options,
            "redirect_messages": redirect_message_count,
            "distinct_search_routes": len(search_route_counter),
        },
        "growth_7d": growth_7d,
        "distributions": {
            "countries": [{"label": label, "count": count} for label, count in country_counter.most_common(8)],
            "genders": [{"label": label, "count": count} for label, count in gender_counter.most_common(6)],
            "roles": [{"label": label, "count": count} for label, count in role_counter.most_common(6)],
            "statuses": [{"label": label, "count": count} for label, count in status_counter.most_common(6)],
            "cabin_classes": [{"label": label, "count": count} for label, count in cabin_counter.most_common(6)],
            "seat_preferences": [{"label": label, "count": count} for label, count in seat_counter.most_common(6)],
            "flight_timings": [{"label": label, "count": count} for label, count in timing_counter.most_common(6)],
        },
        "top_prompts": [{"label": label, "count": count} for label, count in prompt_counter.most_common(6)],
        "top_routes": [{"label": label, "count": count} for label, count in route_counter.most_common(6)],
        "top_search_routes": [{"label": label, "count": count} for label, count in search_route_counter.most_common(12)],
        "funnel_trend_7d": [
            {
                "date": day.date().isoformat(),
                "conversations": sessions_daily.get(day.date().isoformat(), 0),
                "searches": searches_daily.get(day.date().isoformat(), 0),
                "options": options_daily.get(day.date().isoformat(), 0),
                "redirects": redirects_daily.get(day.date().isoformat(), 0),
                "trips": trips_daily.get(day.date().isoformat(), 0),
            }
            for day in recent_days
        ],
        "users": user_rows[:25],
        "session_metrics": session_metrics,
    }


@router.get("/metrics/overview")
def admin_metrics_overview(
    _: None = Depends(require_admin),
    db_chat: Session = Depends(get_chat_db),
    db_user: Session = Depends(get_user_db),
):
    total_searches = (
        db_chat.query(ChatMessage)
        .filter((ChatMessage.content.contains("<FLIGHT_SEARCH>")) | (ChatMessage.msg_type == "flights"))
        .count()
    )
    ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
    active_sessions = db_chat.query(ChatSession).filter(ChatSession.updated_at >= ten_minutes_ago).count()
    feedback_counts = db_user.query(Feedback.status, func.count(Feedback.id)).group_by(Feedback.status).all()
    feedback_summary = {status: count for status, count in feedback_counts}
    return {"total_searches": total_searches, "active_sessions": active_sessions, "feedback_counts": feedback_summary}


@router.get("/overview")
def admin_overview(
    _: None = Depends(require_admin),
    db_chat: Session = Depends(get_chat_db),
    db_user: Session = Depends(get_user_db),
):
    return admin_metrics_overview(_, db_chat, db_user)


@router.get("/users/analytics")
def admin_users_analytics(
    _: None = Depends(require_admin),
    db_chat: Session = Depends(get_chat_db),
    db_user: Session = Depends(get_user_db),
):
    context = _build_admin_data_context(db_user, db_chat)
    return {
        "generated_at": context["generated_at"],
        "totals": context["totals"],
        "growth_7d": context["growth_7d"],
        "distributions": context["distributions"],
        "top_prompts": context["top_prompts"],
        "top_routes": context["top_routes"],
        "top_search_routes": context["top_search_routes"],
        "users": context["users"],
    }


@router.get("/funnel")
def admin_funnel(
    _: None = Depends(require_admin),
    db_chat: Session = Depends(get_chat_db),
    db_user: Session = Depends(get_user_db),
):
    context = _build_admin_data_context(db_user, db_chat)
    totals = context["totals"]
    visitors = totals["total_users"]
    conversations = len(context["session_metrics"])
    flight_searches = totals["total_searches"]
    options_viewed = totals["total_options"]
    redirect_clicks = totals["redirect_messages"]
    trips_saved = sum(1 for user in context["users"] if user["trip_count"] > 0)

    stages = [
        {"key": "visitors", "label": "Registered users", "count": visitors},
        {"key": "conversations", "label": "Chat sessions", "count": conversations},
        {"key": "searches", "label": "Flight searches", "count": flight_searches},
        {"key": "options", "label": "Flight options surfaced", "count": options_viewed},
        {"key": "redirects", "label": "Redirect clicks", "count": redirect_clicks},
        {"key": "trips", "label": "Users with saved trips", "count": trips_saved},
    ]
    base = max(visitors, 1)
    for stage in stages:
        stage["percentage"] = round((stage["count"] / base) * 100, 2)

    drop_offs = []
    for previous, current in zip(stages, stages[1:]):
        drop_count = max(previous["count"] - current["count"], 0)
        drop_percentage = round((drop_count / max(previous["count"], 1)) * 100, 2)
        drop_offs.append(
            {
                "from_key": previous["key"],
                "to_key": current["key"],
                "from_label": previous["label"],
                "to_label": current["label"],
                "drop_count": drop_count,
                "drop_percentage": drop_percentage,
            }
        )

    return {
        "generated_at": context["generated_at"],
        "stages": stages,
        "drop_offs": drop_offs,
        "trend_7d": context["funnel_trend_7d"],
        "top_routes": context["top_routes"],
        "top_search_routes": context["top_search_routes"],
        "top_prompts": context["top_prompts"],
    }


@router.get("/behavior")
def admin_behavior(
    _: None = Depends(require_admin),
    db_chat: Session = Depends(get_chat_db),
    db_user: Session = Depends(get_user_db),
):
    context = _build_admin_data_context(db_user, db_chat)
    session_metrics = context["session_metrics"]
    search_counts = [metric["search_count"] for metric in session_metrics]
    message_counts = [metric["message_count"] for metric in session_metrics]
    duration_minutes = [round(metric["duration_seconds"] / 60) for metric in session_metrics]
    now = datetime.utcnow()
    active_sessions = sum(
        1
        for metric in session_metrics
        if metric["updated_at"] and metric["updated_at"] >= now - timedelta(minutes=10)
    )
    hourly_sessions: Counter[str] = Counter()
    hourly_messages: Counter[str] = Counter()
    hourly_searches: Counter[str] = Counter()
    for metric in session_metrics:
        created_at = metric["created_at"]
        if created_at:
            label = created_at.strftime("%H:00")
            hourly_sessions[label] += 1
            hourly_searches[label] += metric["search_count"]
            hourly_messages[label] += metric["message_count"]

    ordered_hours = sorted(hourly_sessions.keys())
    recent_activity = []
    for metric in sorted(
        session_metrics,
        key=lambda item: item["updated_at"] or item["created_at"] or datetime.min,
        reverse=True,
    )[:10]:
        recent_activity.append(
            {
                "session_id": metric["id"],
                "user_id": metric["user_id"],
                "updated_at": _iso_datetime(metric["updated_at"]),
                "message_count": metric["message_count"],
                "search_count": metric["search_count"],
                "last_message_preview": metric["last_message_preview"],
                "status": "Active" if metric["updated_at"] and metric["updated_at"] >= now - timedelta(minutes=10) else "Idle",
            }
        )

    return {
        "generated_at": context["generated_at"],
        "totals": {
            "session_count": len(session_metrics),
            "active_sessions": active_sessions,
            "authenticated_sessions": context["totals"]["authenticated_sessions"],
            "guest_sessions": context["totals"]["guest_sessions"],
            "avg_searches_per_session": round(sum(search_counts) / len(session_metrics), 2) if session_metrics else 0,
            "avg_messages_per_session": round(sum(message_counts) / len(session_metrics), 2) if session_metrics else 0,
            "avg_session_duration_seconds": round(
                sum(metric["duration_seconds"] for metric in session_metrics) / len(session_metrics)
            ) if session_metrics else 0,
            "messages_last_24h": context["totals"]["messages_last_24h"],
        },
        "search_distribution": _build_bucket_counts(
            search_counts,
            [("0 searches", 0, 0), ("1 search", 1, 1), ("2-3 searches", 2, 3), ("4-5 searches", 4, 5), ("6+ searches", 6, None)],
        ),
        "message_distribution": _build_bucket_counts(
            message_counts,
            [("1-3 messages", 1, 3), ("4-6 messages", 4, 6), ("7-10 messages", 7, 10), ("11-20 messages", 11, 20), ("21+ messages", 21, None)],
        ),
        "session_duration_distribution": _build_bucket_counts(
            duration_minutes,
            [("0-1 min", 0, 1), ("2-3 min", 2, 3), ("4-5 min", 4, 5), ("6-10 min", 6, 10), ("11+ min", 11, None)],
        ),
        "hourly_activity": [
            {"label": hour, "sessions": hourly_sessions[hour], "messages": hourly_messages[hour], "searches": hourly_searches[hour]}
            for hour in ordered_hours
        ],
        "top_prompts": context["top_prompts"],
        "top_routes": context["top_routes"],
        "top_search_routes": context["top_search_routes"],
        "recent_activity": recent_activity,
    }


@router.get("/sessions")
def admin_list_sessions(
    _: None = Depends(require_admin),
    db_chat: Session = Depends(get_chat_db),
):
    sessions = db_chat.query(ChatSession).order_by(ChatSession.updated_at.desc()).limit(50).all()
    if not sessions:
        return {"sessions": []}
    session_ids = [s.id for s in sessions]
    count_rows = (
        db_chat.query(ChatMessage.session_id, func.count(ChatMessage.id))
        .filter(ChatMessage.session_id.in_(session_ids))
        .group_by(ChatMessage.session_id)
        .all()
    )
    counts = {row[0]: row[1] for row in count_rows}
    max_ts_subq = (
        db_chat.query(ChatMessage.session_id.label("sid"), func.max(ChatMessage.created_at).label("max_ts"))
        .filter(ChatMessage.session_id.in_(session_ids))
        .group_by(ChatMessage.session_id)
        .subquery()
    )
    candidates = (
        db_chat.query(ChatMessage)
        .join(
            max_ts_subq,
            and_(ChatMessage.session_id == max_ts_subq.c.sid, ChatMessage.created_at == max_ts_subq.c.max_ts),
        )
        .all()
    )
    last_by_sid: dict[Any, ChatMessage] = {}
    for message in candidates:
        sid = message.session_id
        prev = last_by_sid.get(sid)
        if prev is None or str(message.id) > str(prev.id):
            last_by_sid[sid] = message

    results = []
    for session in sessions:
        msg_count = counts.get(session.id, 0)
        last_msg = last_by_sid.get(session.id)
        preview = None
        if last_msg and last_msg.content:
            preview = last_msg.content[:120] + ("..." if len(last_msg.content) > 120 else "")
        results.append(
            {
                "id": str(session.id),
                "user_id": str(session.user_id) if session.user_id else None,
                "created_at": _iso_datetime(session.created_at),
                "updated_at": _iso_datetime(session.updated_at),
                "message_count": msg_count,
                "last_message_preview": preview,
            }
        )
    return {"sessions": results}


@router.get("/sessions/{session_id}")
def admin_get_session(
    session_id: str,
    _: None = Depends(require_admin),
    db_chat: Session = Depends(get_chat_db),
):
    try:
        sid = UUID(session_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid session id") from exc
    session = db_chat.query(ChatSession).filter(ChatSession.id == sid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = (
        db_chat.query(ChatMessage)
        .filter(ChatMessage.session_id == sid)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return {
        "id": str(session.id),
        "user_id": str(session.user_id) if session.user_id else None,
        "created_at": _iso_datetime(session.created_at),
        "updated_at": _iso_datetime(session.updated_at),
        "messages": [
            {"id": str(message.id), "role": message.role, "content": message.content, "created_at": _iso_datetime(message.created_at)}
            for message in messages
        ],
    }


@router.get("/feedback")
def admin_feedback_list(
    _: None = Depends(require_admin),
    db_user: Session = Depends(get_user_db),
):
    feedback_items = db_user.query(Feedback).order_by(Feedback.created_at.desc()).limit(100).all()
    return {
        "feedback": [
            {
                "id": str(item.id),
                "created_at": _iso_datetime(item.created_at),
                "name": item.name,
                "email": item.email,
                "status": item.status,
                "message_preview": (item.message or "")[:160],
            }
            for item in feedback_items
        ]
    }


@router.get("/feedback/summary")
def admin_feedback_summary(
    _: None = Depends(require_admin),
    db_user: Session = Depends(get_user_db),
):
    feedback_items = db_user.query(Feedback).order_by(Feedback.created_at.desc()).limit(100).all()
    status_counts = Counter(item.status or "new" for item in feedback_items)
    return {
        "total": len(feedback_items),
        "status_counts": dict(status_counts),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/realtime")
def admin_realtime(
    _: None = Depends(require_admin),
    db_chat: Session = Depends(get_chat_db),
):
    sessions = db_chat.query(ChatSession).order_by(ChatSession.updated_at.desc()).limit(25).all()
    if not sessions:
        return {"generated_at": datetime.utcnow().isoformat(), "sessions": []}
    session_ids = [s.id for s in sessions]
    count_rows = (
        db_chat.query(ChatMessage.session_id, func.count(ChatMessage.id))
        .filter(ChatMessage.session_id.in_(session_ids))
        .group_by(ChatMessage.session_id)
        .all()
    )
    counts = {row[0]: row[1] for row in count_rows}
    return {
        "generated_at": datetime.utcnow().isoformat(),
        "sessions": [
            {
                "id": str(session.id),
                "user_id": str(session.user_id) if session.user_id else None,
                "updated_at": _iso_datetime(session.updated_at),
                "message_count": counts.get(session.id, 0),
            }
            for session in sessions
        ],
    }


@router.get("/feedback/{feedback_id}")
def admin_feedback_detail(
    feedback_id: str,
    _: None = Depends(require_admin),
    db_user: Session = Depends(get_user_db),
):
    try:
        fid = UUID(feedback_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid feedback id") from exc
    item = db_user.query(Feedback).filter(Feedback.id == fid).first()
    if not item:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return {
        "id": str(item.id),
        "created_at": _iso_datetime(item.created_at),
        "updated_at": _iso_datetime(item.updated_at),
        "name": item.name,
        "email": item.email,
        "status": item.status,
        "message": item.message,
        "context_chat": item.context_chat,
        "context_flights": item.context_flights,
        "context_page": item.context_page,
    }


@router.patch("/feedback/{feedback_id}")
def admin_feedback_patch(
    feedback_id: str,
    payload: dict[str, Any],
    _: None = Depends(require_admin),
    db_user: Session = Depends(get_user_db),
):
    allowed = {"new", "in_review", "resolved", "dismissed"}
    status = (payload.get("status") or "").strip()
    if status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")
    try:
        fid = UUID(feedback_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid feedback id") from exc
    item = db_user.query(Feedback).filter(Feedback.id == fid).first()
    if not item:
        raise HTTPException(status_code=404, detail="Feedback not found")
    item.status = status
    item.updated_at = datetime.utcnow()
    db_user.add(item)
    db_user.commit()
    db_user.refresh(item)
    return {"ok": True, "id": str(item.id), "status": item.status}
