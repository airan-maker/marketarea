import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.router import router
from app.config import get_settings
from app.database import get_db_engine

settings = get_settings()
logger = logging.getLogger("etl.startup")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown events."""
    # Startup: ETL 상태 로깅
    try:
        engine = get_db_engine()
        async with engine.connect() as conn:
            grid_count = (await conn.execute(text("SELECT COUNT(*) FROM grid_master"))).scalar()
            store_count = (await conn.execute(text("SELECT COUNT(*) FROM grid_store_stats"))).scalar()
            score_count = (await conn.execute(text("SELECT COUNT(*) FROM grid_score"))).scalar()
            logger.info(
                "ETL Status: grids=%s, store_stats=%s, scores=%s",
                grid_count, store_count, score_count,
            )
            if grid_count == 0:
                logger.warning("No grid data! ETL may not have run.")
            elif score_count == 0:
                logger.warning("No score data! Score calculation may have failed.")
    except Exception as e:
        logger.warning("Could not check ETL status: %s", e)

    yield


app = FastAPI(
    title="MarketArea API",
    description="상권 분석 SaaS - 서울 지역 100m Grid 기반 분석",
    version="0.2.0",
    lifespan=lifespan,
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
