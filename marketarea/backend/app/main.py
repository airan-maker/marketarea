from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="MarketArea API",
    description="상권 분석 SaaS - 서울 지역 100m Grid 기반 분석",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
