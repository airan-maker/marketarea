from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from app.database import Base


class GridStoreStats(Base):
    __tablename__ = "grid_store_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    grid_id = Column(Integer, ForeignKey("grid_master.id"), nullable=False, index=True)
    industry_code = Column(String(10), nullable=False, index=True)
    store_count = Column(Integer, default=0)
    open_count = Column(Integer, default=0)
    close_count = Column(Integer, default=0)
    closure_rate = Column(Float)
    snapshot_quarter = Column(String(7))  # e.g. "2024-Q3"


class GridFloatingStats(Base):
    __tablename__ = "grid_floating_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    grid_id = Column(Integer, ForeignKey("grid_master.id"), nullable=False, index=True)
    total_floating = Column(Float, default=0)
    lunch_ratio = Column(Float)     # 11~14시
    dinner_ratio = Column(Float)    # 17~21시
    night_ratio = Column(Float)     # 21~06시
    weekday_avg = Column(Float)
    weekend_avg = Column(Float)
    snapshot_date = Column(Date)


class GridPopulationStats(Base):
    __tablename__ = "grid_population_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    grid_id = Column(Integer, ForeignKey("grid_master.id"), nullable=False, index=True)
    total_population = Column(Integer, default=0)
    age_20_39_ratio = Column(Float)    # 20~39세 비율
    age_40_59_ratio = Column(Float)    # 40~59세 비율
    age_60_plus_ratio = Column(Float)  # 60세 이상 비율
    household_1_2_ratio = Column(Float)  # 1~2인 가구 비율
    snapshot_date = Column(Date)


class GridSalesStats(Base):
    __tablename__ = "grid_sales_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    grid_id = Column(Integer, ForeignKey("grid_master.id"), nullable=False, index=True)
    industry_code = Column(String(10), nullable=False, index=True)
    quarterly_sales = Column(Float)        # 분기 매출
    quarterly_count = Column(Integer)      # 분기 건수
    avg_ticket_price = Column(Float)       # 객단가
    sales_per_store = Column(Float)        # 점포당 매출
    snapshot_quarter = Column(String(7))


class GridRentStats(Base):
    __tablename__ = "grid_rent_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    grid_id = Column(Integer, ForeignKey("grid_master.id"), nullable=False, index=True)
    rent_per_m2 = Column(Float)             # m2당 임대료
    rent_price_index = Column(Float)        # 임대가격지수
    deposit_per_m2 = Column(Float)          # m2당 보증금
    snapshot_quarter = Column(String(7))


class GridScore(Base):
    __tablename__ = "grid_score"

    id = Column(Integer, primary_key=True, autoincrement=True)
    grid_id = Column(Integer, ForeignKey("grid_master.id"), nullable=False, index=True)
    industry_code = Column(String(10), nullable=False, index=True)
    health_score = Column(Float)          # 0~100 종합 건강도
    competition_index = Column(Float)     # 경쟁 지수
    survival_probability = Column(Float)  # 생존 확률 (0~1)
    sales_estimate_low = Column(Float)    # 예상 매출 하한
    sales_estimate_high = Column(Float)   # 예상 매출 상한
    population_score = Column(Float)      # 인구 점수
    floating_score = Column(Float)        # 유동인구 점수
    rent_score = Column(Float)            # 임대료 점수
    risk_flags = Column(String(500))      # JSON 리스크 경고
    snapshot_quarter = Column(String(7))
