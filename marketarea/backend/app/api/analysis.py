"""분석 API 엔드포인트."""
import subprocess
import sys
import logging
from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResult,
    IndustryItem,
    GridHealthResponse,
)
from app.services.grid_aggregator import aggregate_grids

etl_logger = logging.getLogger("etl.api")

router = APIRouter()

# 업종 목록 (샘플)
INDUSTRIES = [
    {"code": "Q01", "name": "한식음식점", "category": "음식"},
    {"code": "Q02", "name": "중식음식점", "category": "음식"},
    {"code": "Q03", "name": "패스트푸드점", "category": "음식"},
    {"code": "Q04", "name": "치킨전문점", "category": "음식"},
    {"code": "Q05", "name": "분식점", "category": "음식"},
    {"code": "Q06", "name": "일식음식점", "category": "음식"},
    {"code": "Q07", "name": "양식음식점", "category": "음식"},
    {"code": "Q08", "name": "제과점", "category": "음식"},
    {"code": "Q09", "name": "피자전문점", "category": "음식"},
    {"code": "Q10", "name": "주점", "category": "음식"},
    {"code": "Q11", "name": "카페", "category": "음식"},
    {"code": "Q12", "name": "커피전문점", "category": "음식"},
    {"code": "F01", "name": "화장품소매점", "category": "소매"},
    {"code": "F02", "name": "편의점", "category": "소매"},
    {"code": "F03", "name": "슈퍼마켓", "category": "소매"},
    {"code": "F04", "name": "의류점", "category": "소매"},
    {"code": "F05", "name": "안경점", "category": "소매"},
    {"code": "F06", "name": "약국", "category": "의료"},
    {"code": "F07", "name": "세탁소", "category": "서비스"},
    {"code": "F08", "name": "미용실", "category": "서비스"},
    {"code": "F09", "name": "학원", "category": "교육"},
    {"code": "F10", "name": "생활잡화소매점", "category": "소매"},
]


@router.post("/analysis", response_model=AnalysisResult)
async def run_analysis(
    req: AnalysisRequest,
    db: AsyncSession = Depends(get_db),
):
    """주어진 좌표/반경/업종에 대한 상권 분석을 수행한다."""
    result = await aggregate_grids(
        session=db,
        lat=req.lat,
        lng=req.lng,
        radius=req.radius,
        industry_code=req.industry_code,
    )
    return AnalysisResult(**result)


@router.get("/industries", response_model=list[IndustryItem])
async def list_industries():
    """업종 목록을 반환한다."""
    return [IndustryItem(**ind) for ind in INDUSTRIES]


@router.get("/health/{grid_id}", response_model=GridHealthResponse)
async def get_grid_health(
    grid_id: int,
    db: AsyncSession = Depends(get_db),
):
    """특정 Grid의 상세 건강도를 반환한다."""
    grid_row = await db.execute(text(
        "SELECT id, grid_code, center_lat, center_lng FROM grid_master WHERE id = :gid"
    ), {"gid": grid_id})
    grid = grid_row.fetchone()

    if not grid:
        return GridHealthResponse(
            grid_id=grid_id, grid_code="", center_lat=0, center_lng=0, scores={}
        )

    score_rows = await db.execute(text("""
        SELECT industry_code, health_score, competition_index,
               survival_probability, sales_estimate_low, sales_estimate_high
        FROM grid_score WHERE grid_id = :gid
    """), {"gid": grid_id})

    scores = {}
    for row in score_rows.fetchall():
        scores[row[0]] = {
            "health_score": row[1],
            "competition_index": row[2],
            "survival_probability": row[3],
            "sales_estimate_low": row[4],
            "sales_estimate_high": row[5],
        }

    return GridHealthResponse(
        grid_id=grid[0],
        grid_code=grid[1],
        center_lat=grid[2],
        center_lng=grid[3],
        scores=scores,
    )


def _run_etl_subprocess(force: bool = False):
    """ETL을 별도 프로세스로 실행 (백그라운드 태스크)."""
    cmd = [sys.executable, "scripts/run_etl.py"]
    if force:
        cmd.append("--force")
    etl_logger.info("Starting ETL subprocess: %s", cmd)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode == 0:
            etl_logger.info("ETL completed successfully")
        else:
            etl_logger.error("ETL failed (rc=%d): %s", result.returncode, result.stderr)
    except subprocess.TimeoutExpired:
        etl_logger.error("ETL timed out after 600s")
    except Exception as e:
        etl_logger.error("ETL subprocess error: %s", e)


@router.post("/etl/run")
async def trigger_etl(
    background_tasks: BackgroundTasks,
    force: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """ETL 수동 트리거 엔드포인트. force=true로 전체 재실행."""
    # 현재 상태 반환
    grid_count = (await db.execute(text("SELECT COUNT(*) FROM grid_master"))).scalar()
    store_count = (await db.execute(text("SELECT COUNT(*) FROM grid_store_stats"))).scalar()
    score_count = (await db.execute(text("SELECT COUNT(*) FROM grid_score"))).scalar()

    background_tasks.add_task(_run_etl_subprocess, force)

    return {
        "status": "started",
        "force": force,
        "current_state": {
            "grids": grid_count,
            "store_stats": store_count,
            "scores": score_count,
        },
    }


@router.get("/etl/status")
async def etl_status(db: AsyncSession = Depends(get_db)):
    """현재 ETL 데이터 상태를 반환한다."""
    counts = {}
    for table in [
        "grid_master", "store_master", "grid_store_stats",
        "grid_floating_stats", "grid_population_stats",
        "grid_sales_stats", "grid_rent_stats", "grid_score",
    ]:
        result = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))
        counts[table] = result.scalar()

    return {"status": "ok", "counts": counts}
