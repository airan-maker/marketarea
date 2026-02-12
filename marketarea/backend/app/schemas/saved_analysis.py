from pydantic import BaseModel, Field
from datetime import datetime


class SaveAnalysisRequest(BaseModel):
    address: str
    industry_code: str
    industry_name: str
    lat: float
    lng: float
    radius: int
    result_json: dict
    memo: str | None = Field(None, max_length=1000)


class SavedAnalysisResponse(BaseModel):
    id: int
    address: str
    industry_code: str
    industry_name: str
    lat: float
    lng: float
    radius: int
    result_json: dict
    memo: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SavedAnalysisListResponse(BaseModel):
    items: list[SavedAnalysisResponse]
    total: int
