from fastapi import APIRouter
from app.api.analysis import router as analysis_router
from app.api.saved_analyses import router as saved_analyses_router
from app.api.users import router as users_router

router = APIRouter()
router.include_router(analysis_router, tags=["analysis"])
router.include_router(saved_analyses_router)
router.include_router(users_router)
