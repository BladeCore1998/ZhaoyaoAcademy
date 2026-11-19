from fastapi import APIRouter, FastAPI
from pydantic import BaseModel

from app.config import Settings

settings = Settings()

app = FastAPI(
    title="招摇书院中间件服务",
    version="0.1.0",
    description="当前仅提供路由骨架，业务能力后续按领域逐步接入。",
    openapi_url="/openapi.json" if settings.is_development else None,
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    swagger_ui_oauth2_redirect_url="/docs/oauth2-redirect"
    if settings.is_development
    else None,
)

api_router = APIRouter(prefix="/api/v1")


class ServiceStatus(BaseModel):
    service: str
    status: str


@api_router.get("/health", response_model=ServiceStatus, tags=["system"])
async def health() -> ServiceStatus:
    return ServiceStatus(service="academy-py", status="ok")


@api_router.get("/routes", tags=["system"])
async def routes() -> dict[str, list[str]]:
    return {
        "reserved": [
            "/api/v1/health",
            "/api/v1/transform",
            "/api/v1/middleware",
        ]
    }


app.include_router(api_router)

