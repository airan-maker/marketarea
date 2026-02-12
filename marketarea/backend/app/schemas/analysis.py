from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    lat: float = Field(..., ge=37.0, le=38.0, description="위도")
    lng: float = Field(..., ge=126.0, le=128.0, description="경도")
    radius: int = Field(default=500, ge=100, le=2000, description="반경 (m)")
    industry_code: str = Field(..., min_length=1, description="업종 코드")


class RiskFlag(BaseModel):
    level: str       # "warning" | "danger"
    message: str


class AnalysisResult(BaseModel):
    health_score: float = Field(..., ge=0, le=100, description="종합 건강도 (0~100)")
    competition_index: float = Field(..., description="경쟁 지수 (과밀도)")
    survival_probability: float = Field(..., ge=0, le=1, description="생존 확률")
    sales_estimate_low: float = Field(..., description="예상 월매출 하한 (만원)")
    sales_estimate_high: float = Field(..., description="예상 월매출 상한 (만원)")
    store_count: int = Field(..., description="반경 내 동일업종 점포수")
    floating_population: float = Field(..., description="일평균 유동인구")
    resident_population: int = Field(..., description="거주인구")
    avg_rent_per_m2: float = Field(..., description="평균 m2당 임대료 (원)")
    population_score: float
    floating_score: float
    rent_score: float
    risk_flags: list[RiskFlag] = []
    grid_count: int = Field(..., description="분석에 포함된 격자 수")


class IndustryItem(BaseModel):
    code: str
    name: str
    category: str


class GridHealthResponse(BaseModel):
    grid_id: int
    grid_code: str
    center_lat: float
    center_lng: float
    scores: dict
