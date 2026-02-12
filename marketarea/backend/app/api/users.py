from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User
from app.schemas.user import EnsureUserRequest, EnsureUserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/ensure", response_model=EnsureUserResponse)
async def ensure_user(req: EnsureUserRequest, db: AsyncSession = Depends(get_db)):
    """유저가 없으면 생성, 있으면 last_login_at 갱신 후 userId 반환."""
    result = await db.execute(
        select(User).where(User.google_id == req.google_id)
    )
    user = result.scalar_one_or_none()

    if user:
        user.last_login_at = func.now()
        if req.name:
            user.name = req.name
        if req.profile_image:
            user.profile_image = req.profile_image
        await db.commit()
        return EnsureUserResponse(user_id=user.id, is_new=False)

    new_user = User(
        google_id=req.google_id,
        email=req.email,
        name=req.name,
        profile_image=req.profile_image,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return EnsureUserResponse(user_id=new_user.id, is_new=True)
