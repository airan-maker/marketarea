"""분석 API 엔드포인트."""
from fastapi import APIRouter, Depends
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
