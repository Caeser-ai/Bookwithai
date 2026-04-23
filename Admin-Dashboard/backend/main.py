import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as api_router

# ---------------------------------------------------------------------------
# CORS origins — read from environment so nothing is hardcoded
# Set ALLOWED_ORIGINS as a comma-separated list in production, e.g.:
#   ALLOWED_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com
# ---------------------------------------------------------------------------
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS: list[str] = (
    [o.strip() for o in _raw_origins.split(",") if o.strip()]
    if _raw_origins
    else []
)

# In development fall back to the local Next.js dev server only
if not ALLOWED_ORIGINS:
    ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

AUTO_CREATE_TABLES = os.getenv("AUTO_CREATE_TABLES", "").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    if AUTO_CREATE_TABLES:
        from database import BaseUser, BaseChat, engine_chat, engine_user

        BaseUser.metadata.create_all(bind=engine_user)
        BaseChat.metadata.create_all(bind=engine_chat)
    yield


_app_kwargs = dict(
    title="Book With AI API",
    description="AI-powered travel assistant backend",
    version="1.0.0",
)

if AUTO_CREATE_TABLES:
    # Avoid DDL on every Vercel cold start. Use migrations in deployed envs,
    # and opt into auto-create locally when needed.
    _app_kwargs["lifespan"] = lifespan

app = FastAPI(**_app_kwargs)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(api_router, prefix="/api")
