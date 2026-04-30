"""Helpers for recording outbound third-party API usage for admin monitoring."""

import json
import logging
import os
import re
import time
import uuid
from threading import Lock
from typing import Any, Mapping

import httpx
from sqlalchemy import text

from database import SessionUser, engine_user


logger = logging.getLogger(__name__)

_MONITORING_READY = False
_MONITORING_LOCK = Lock()
_HASH_RE = re.compile(r"^[A-Za-z0-9_\-]{20,}$")

MONITORED_EXTERNAL_PROVIDERS = (
    "Amadeus",
    "SerpAPI",
    "FlightAware",
    "OpenAI",
    "OpenWeather",
    "Google Maps",
)

DEFAULT_PROVIDER_CONFIGS = [
    ("Admin", 150000, 0.0),
    ("Chat", 200000, 0.0025),
    ("Chat Endpoint", 250000, 0.0),
    ("OpenAI", 200000, 0.0025),
    ("Amadeus", 120000, 0.0035),
    ("SerpAPI", 80000, 0.0050),
    ("Flights API", 150000, 0.0),
    ("Sessions", 250000, 0.0),
    ("Trips", 100000, 0.0),
    ("Price Alerts", 100000, 0.0),
    ("OpenWeather", 50000, 0.0010),
    ("Weather Endpoint", 100000, 0.0),
    ("Google Maps", 70000, 0.0020),
    ("Maps Endpoint", 100000, 0.0),
    ("FlightAware", 20000, 0.0120),
    ("Auth", 150000, 0.0004),
    ("Health", 500000, 0.0),
    ("Frontend", 500000, 0.0),
    ("Backend", 500000, 0.0),
    ("Internal", 500000, 0.0),
]

PROVIDER_KEY_NAMES = {
    "OpenAI": "OPENAI_API_KEY",
    "Amadeus": "AMADEUS_CLIENT_SECRET",
    "SerpAPI": "SERPAPI_API_KEY",
    "OpenWeather": "OPENWEATHER_API_KEY",
    "Google Maps": "GOOGLE_MAPS_API_KEY",
    "FlightAware": "FLIGHTAWARE_API_KEY",
}

SENSITIVE_QUERY_KEYS = {
    "api_key",
    "appid",
    "key",
    "authorization",
    "token",
    "client_id",
    "client_secret",
}


def _safe_last4(value: str | None) -> str | None:
    if not value:
        return None

    cleaned = value.strip()
    if not cleaned:
        return None
    if cleaned.startswith("Bearer "):
        cleaned = cleaned[7:].strip()
    if _HASH_RE.match(cleaned) or len(cleaned) >= 8:
        return cleaned[-4:]
    return None


def ensure_api_monitoring_infra() -> None:
    global _MONITORING_READY
    if _MONITORING_READY or engine_user is None:
        return

    with _MONITORING_LOCK:
        if _MONITORING_READY or engine_user is None:
            return

        with engine_user.begin() as conn:
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS api_request_logs (
                      id UUID PRIMARY KEY,
                      request_id VARCHAR(64),
                      method VARCHAR(16) NOT NULL,
                      path VARCHAR(255) NOT NULL,
                      status_code INTEGER NOT NULL,
                      latency_ms INTEGER NOT NULL,
                      query_params JSONB,
                      provider VARCHAR(64),
                      api_key_name VARCHAR(128),
                      api_key_last4 VARCHAR(8),
                      user_id VARCHAR(64),
                      client_ip VARCHAR(64),
                      user_agent TEXT,
                      error_message TEXT,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
            )
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS api_metrics_1m (
                      bucket_start TIMESTAMP NOT NULL,
                      method VARCHAR(16) NOT NULL,
                      path VARCHAR(255) NOT NULL,
                      provider VARCHAR(64) NOT NULL,
                      request_count INTEGER NOT NULL DEFAULT 0,
                      success_count INTEGER NOT NULL DEFAULT 0,
                      error_count INTEGER NOT NULL DEFAULT 0,
                      total_latency_ms BIGINT NOT NULL DEFAULT 0,
                      max_latency_ms INTEGER NOT NULL DEFAULT 0,
                      PRIMARY KEY (bucket_start, method, path, provider)
                    )
                    """
                )
            )
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS api_key_registry (
                      key_name VARCHAR(128) PRIMARY KEY,
                      provider VARCHAR(64) NOT NULL,
                      status VARCHAR(24) NOT NULL DEFAULT 'active',
                      key_last4 VARCHAR(8),
                      last_used_at TIMESTAMP NULL,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
            )
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS api_provider_config (
                      provider VARCHAR(64) PRIMARY KEY,
                      quota_daily INTEGER NOT NULL DEFAULT 0,
                      cost_per_request NUMERIC(12, 6) NOT NULL DEFAULT 0,
                      currency VARCHAR(8) NOT NULL DEFAULT 'USD',
                      is_active BOOLEAN NOT NULL DEFAULT TRUE,
                      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON api_request_logs (created_at)"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS idx_api_request_logs_path ON api_request_logs (path)"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS idx_api_request_logs_status_code ON api_request_logs (status_code)"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS idx_api_key_registry_provider ON api_key_registry (provider)"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS idx_api_key_registry_last_used_at ON api_key_registry (last_used_at)"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS idx_api_provider_config_active ON api_provider_config (is_active)"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS idx_api_metrics_1m_bucket_start ON api_metrics_1m (bucket_start)"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS idx_api_metrics_1m_path ON api_metrics_1m (path)"
                )
            )
            for provider, quota_daily, cost_per_request in DEFAULT_PROVIDER_CONFIGS:
                conn.execute(
                    text(
                        """
                        INSERT INTO api_provider_config (provider, quota_daily, cost_per_request, currency, is_active, updated_at)
                        VALUES (:provider, :quota_daily, :cost_per_request, 'USD', TRUE, NOW())
                        ON CONFLICT (provider) DO NOTHING
                        """
                    ),
                    {
                        "provider": provider,
                        "quota_daily": quota_daily,
                        "cost_per_request": cost_per_request,
                    },
                )

        _MONITORING_READY = True


def _ensure_monitoring_infra() -> None:
    ensure_api_monitoring_infra()


def _provider_key_name(provider: str) -> str | None:
    return PROVIDER_KEY_NAMES.get(provider)


def _sanitize_query_params(value: Any) -> Any:
    if isinstance(value, Mapping):
        sanitized: dict[str, Any] = {}
        for key, item in value.items():
            normalized_key = str(key).strip().lower()
            if normalized_key in SENSITIVE_QUERY_KEYS:
                sanitized[str(key)] = "***"
            else:
                sanitized[str(key)] = _sanitize_query_params(item)
        return sanitized

    if isinstance(value, (list, tuple, set)):
        return [_sanitize_query_params(item) for item in value]

    return value


def _serialize_query_params(query_params: Mapping[str, Any] | None) -> str:
    if not query_params:
        return "{}"
    return json.dumps(_sanitize_query_params(query_params), default=str)


def _resolve_status(status_code: int | None) -> int:
    if isinstance(status_code, int) and status_code > 0:
        return status_code
    return 500


def _elapsed_ms(started: float) -> int:
    return max(int((time.perf_counter() - started) * 1000), 0)


def _exception_status_code(exc: Exception) -> int:
    response = getattr(exc, "response", None)
    status_code = getattr(response, "status_code", None)
    if isinstance(status_code, int) and status_code > 0:
        return status_code

    status_code = getattr(exc, "status_code", None)
    if isinstance(status_code, int) and status_code > 0:
        return status_code
    return 500


def log_external_api_request(
    *,
    provider: str,
    path: str,
    method: str,
    status_code: int,
    latency_ms: int,
    query_params: Mapping[str, Any] | None = None,
    error_message: str | None = None,
) -> None:
    try:
        _ensure_monitoring_infra()
        if engine_user is None:
            return

        key_name = _provider_key_name(provider)
        key_last4 = _safe_last4(os.getenv(key_name or "", ""))
        db = SessionUser()
        try:
            db.execute(
                text(
                    """
                    INSERT INTO api_request_logs (
                      id, request_id, method, path, status_code, latency_ms, query_params,
                      provider, api_key_name, api_key_last4, user_id, client_ip, user_agent, error_message, created_at
                    ) VALUES (
                      :id, NULL, :method, :path, :status_code, :latency_ms, CAST(:query_params AS JSONB),
                      :provider, :api_key_name, :api_key_last4, NULL, NULL, :user_agent, :error_message, NOW()
                    )
                    """
                ),
                {
                    "id": str(uuid.uuid4()),
                    "method": method.upper(),
                    "path": path,
                    "status_code": _resolve_status(status_code),
                    "latency_ms": max(int(latency_ms or 0), 0),
                    "query_params": _serialize_query_params(query_params),
                    "provider": provider,
                    "api_key_name": key_name,
                    "api_key_last4": key_last4,
                    "user_agent": "external-api-monitor",
                    "error_message": error_message,
                },
            )
            if key_name:
                db.execute(
                    text(
                        """
                        INSERT INTO api_key_registry (
                          key_name, provider, status, key_last4, last_used_at, updated_at
                        ) VALUES (
                          :key_name, :provider, 'active', :key_last4, NOW(), NOW()
                        )
                        ON CONFLICT (key_name) DO UPDATE SET
                          provider = EXCLUDED.provider,
                          status = 'active',
                          key_last4 = COALESCE(EXCLUDED.key_last4, api_key_registry.key_last4),
                          last_used_at = NOW(),
                          updated_at = NOW()
                        """
                    ),
                    {
                        "key_name": key_name,
                        "provider": provider,
                        "key_last4": key_last4,
                    },
                )
            db.commit()
        finally:
            db.close()
    except Exception:
        logger.exception("Failed to record external API usage", extra={"provider": provider, "path": path})


async def monitored_httpx_request(
    client: httpx.AsyncClient,
    *,
    provider: str,
    path: str,
    method: str,
    url: str,
    query_params: Mapping[str, Any] | None = None,
    **kwargs: Any,
) -> httpx.Response:
    started = time.perf_counter()
    effective_query = query_params if query_params is not None else kwargs.get("params")
    try:
        response = await client.request(method=method, url=url, **kwargs)
        log_external_api_request(
            provider=provider,
            path=path,
            method=method,
            status_code=response.status_code,
            latency_ms=_elapsed_ms(started),
            query_params=effective_query,
        )
        return response
    except Exception as exc:
        log_external_api_request(
            provider=provider,
            path=path,
            method=method,
            status_code=_exception_status_code(exc),
            latency_ms=_elapsed_ms(started),
            query_params=effective_query,
            error_message=str(exc),
        )
        raise


def monitored_openai_chat_completion(
    client: Any,
    *,
    path: str,
    **kwargs: Any,
) -> Any:
    started = time.perf_counter()
    query_params = {
        "model": kwargs.get("model"),
        "stream": bool(kwargs.get("stream")),
    }
    try:
        response = client.chat.completions.create(**kwargs)
        log_external_api_request(
            provider="OpenAI",
            path=path,
            method="POST",
            status_code=200,
            latency_ms=_elapsed_ms(started),
            query_params=query_params,
        )
        return response
    except Exception as exc:
        log_external_api_request(
            provider="OpenAI",
            path=path,
            method="POST",
            status_code=_exception_status_code(exc),
            latency_ms=_elapsed_ms(started),
            query_params=query_params,
            error_message=str(exc),
        )
        raise
