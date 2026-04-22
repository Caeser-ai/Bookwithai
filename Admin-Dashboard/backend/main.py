import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from mangum import Mangum
from api.routes import router as api_router
from database import engine_user, engine_chat, BaseUser, BaseChat

# Import all models so metadata is populated
import models  # noqa: F401

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    BaseUser.metadata.create_all(bind=engine_user)
    BaseChat.metadata.create_all(bind=engine_chat)
    yield


app = FastAPI(
    title="Book With AI API",
    description="AI-powered travel assistant backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(api_router, prefix="/api")

# Vercel serverless entry point — lifespan="off" skips create_all on every cold start
handler = Mangum(app, lifespan="off")
