from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .routes.admin import router as admin_router
except ImportError:
    from routes.admin import router as admin_router

app = FastAPI(title="BookwithAI Admin Lite Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(admin_router)

