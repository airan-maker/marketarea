from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from app.database import get_db
from app.models.user import User
from app.models.saved_analysis import SavedAnalysis
from app.schemas.saved_analysis import (
    SaveAnalysisRequest,
    SavedAnalysisResponse,
    SavedAnalysisListResponse,
)
from app.api.auth_dep import get_current_user

router = APIRouter(prefix="/saved-analyses", tags=["saved-analyses"])


async def _get_user_id(db: AsyncSession, google_id: str) -> int:
    result = await db.execute(
        select(User.id).where(User.google_id == google_id)
    )
    user_id = result.scalar_one_or_none()
    if not user_id:
        raise HTTPException(status_code=404, detail="User not found")
    return user_id


@router.post("", response_model=SavedAnalysisResponse, status_code=201)
async def save_analysis(
    req: SaveAnalysisRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id(db, current_user["google_id"])

    analysis = SavedAnalysis(
        user_id=user_id,
        address=req.address,
        industry_code=req.industry_code,
        industry_name=req.industry_name,
        lat=req.lat,
        lng=req.lng,
        radius=req.radius,
        result_json=req.result_json,
        memo=req.memo,
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return analysis


@router.get("", response_model=SavedAnalysisListResponse)
async def list_saved_analyses(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id(db, current_user["google_id"])

    count_result = await db.execute(
        select(func.count()).where(SavedAnalysis.user_id == user_id)
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        select(SavedAnalysis)
        .where(SavedAnalysis.user_id == user_id)
        .order_by(SavedAnalysis.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    items = list(result.scalars().all())

    return SavedAnalysisListResponse(items=items, total=total)


@router.delete("/{analysis_id}", status_code=204)
async def delete_saved_analysis(
    analysis_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id(db, current_user["google_id"])

    result = await db.execute(
        select(SavedAnalysis).where(
            SavedAnalysis.id == analysis_id,
            SavedAnalysis.user_id == user_id,
        )
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    await db.delete(analysis)
    await db.commit()
