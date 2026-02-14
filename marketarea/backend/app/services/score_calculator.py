"""점수 계산 엔진 — 건강도, 경쟁지수, 생존확률 등 (벌크 SQL 최적화)."""
import json
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.etl.logger import get_etl_logger

logger = get_etl_logger("score_calculator")

# 업종별 평균 폐업률 (샘플 기준값)
DEFAULT_CLOSURE_RATES = {
    "Q01": 0.18,  # 한식
    "Q03": 0.22,  # 패스트푸드
    "Q04": 0.20,  # 치킨
    "Q12": 0.15,  # 커피전문점
    "F01": 0.12,  # 화장품
    "F02": 0.08,  # 편의점
    "F10": 0.14,  # 생활잡화
}

DEFAULT_CLOSURE_RATE = 0.20


def compute_all_scores(session: Session) -> int:
    """벌크 SQL로 모든 Grid x 업종 점수를 계산한다.

    기존: 56,000 grids x N industries = 수십만 개별 쿼리
    개선: store_stats에 존재하는 (grid_id, industry_code) 쌍만 대상으로
          단일 쿼리에서 모든 stats를 JOIN → Python에서 점수 계산 → 벌크 INSERT
    """
    session.execute(text("DELETE FROM grid_score"))

    # 1) 서울 전체 평균값 (단일 쿼리)
    seoul_avg = _compute_seoul_averages(session)
    logger.info("Seoul averages: %s", seoul_avg)

    # 2) store_stats에 존재하는 (grid_id, industry_code) 쌍에 대해
    #    모든 stats를 LEFT JOIN한 결과를 한 번에 가져옴
    rows = session.execute(text("""
        SELECT
            gs.grid_id,
            gs.industry_code,
            gs.store_count,
            COALESCE(gs.closure_rate, :default_closure) as closure_rate,
            COALESCE(gf.total_floating, 0) as total_floating,
            COALESCE(gp.total_population, 0) as total_population,
            COALESCE(gp.age_20_39_ratio, 0.3) as age_20_39_ratio,
            COALESCE(gsa.quarterly_sales, 0) as quarterly_sales,
            COALESCE(gsa.avg_ticket_price, 0) as avg_ticket_price,
            COALESCE(gr.rent_per_m2, 0) as rent_per_m2
        FROM grid_store_stats gs
        LEFT JOIN grid_floating_stats gf ON gf.grid_id = gs.grid_id
        LEFT JOIN grid_population_stats gp ON gp.grid_id = gs.grid_id
        LEFT JOIN (
            SELECT DISTINCT ON (grid_id, industry_code)
                grid_id, industry_code, quarterly_sales, avg_ticket_price
            FROM grid_sales_stats
            ORDER BY grid_id, industry_code, snapshot_quarter DESC
        ) gsa ON gsa.grid_id = gs.grid_id AND gsa.industry_code = gs.industry_code
        LEFT JOIN (
            SELECT DISTINCT ON (grid_id)
                grid_id, rent_per_m2
            FROM grid_rent_stats
            ORDER BY grid_id, snapshot_quarter DESC
        ) gr ON gr.grid_id = gs.grid_id
    """), {"default_closure": DEFAULT_CLOSURE_RATE}).fetchall()

    if not rows:
        logger.warning("No store_stats rows found, nothing to score")
        return 0

    logger.info("Computing scores for %d (grid, industry) pairs", len(rows))

    # 3) Python에서 점수 계산 후 벌크 INSERT
    batch = []
    for row in rows:
        score = _compute_score(row, seoul_avg)
        batch.append(score)

        if len(batch) >= 1000:
            _insert_batch(session, batch)
            batch.clear()

    if batch:
        _insert_batch(session, batch)

    session.commit()
    logger.info("Computed %d grid scores", len(rows))
    return len(rows)


def _compute_seoul_averages(session: Session) -> dict:
    """서울 전체 평균 통계 — 단일 쿼리들."""
    avg_stores = session.execute(text(
        "SELECT AVG(store_count) FROM grid_store_stats"
    )).scalar() or 1.0

    avg_floating = session.execute(text(
        "SELECT AVG(total_floating) FROM grid_floating_stats"
    )).scalar() or 1.0

    avg_population = session.execute(text(
        "SELECT AVG(total_population) FROM grid_population_stats"
    )).scalar() or 1.0

    avg_sales = session.execute(text(
        "SELECT AVG(quarterly_sales) FROM grid_sales_stats"
    )).scalar() or 1.0

    avg_rent = session.execute(text(
        "SELECT AVG(rent_per_m2) FROM grid_rent_stats"
    )).scalar() or 1.0

    return {
        "avg_stores": float(avg_stores),
        "avg_floating": float(avg_floating),
        "avg_population": float(avg_population),
        "avg_sales": float(avg_sales),
        "avg_rent": float(avg_rent),
    }


def _compute_score(row, seoul_avg: dict) -> dict:
    """단일 행에 대한 점수 계산."""
    grid_id = row[0]
    industry_code = row[1]
    store_count = row[2] or 0
    closure_rate = row[3] or DEFAULT_CLOSURE_RATE
    total_floating = row[4] or 0
    total_pop = row[5] or 0
    quarterly_sales = row[7] or 0
    rent_per_m2 = row[9] or 0

    # Competition Index
    competition_index = store_count / seoul_avg["avg_stores"] if seoul_avg["avg_stores"] else 0

    # Survival Probability
    base_survival = 1 - closure_rate
    floating_adj = 0.05 if total_floating > seoul_avg["avg_floating"] else -0.03
    pop_adj = 0.03 if total_pop > seoul_avg["avg_population"] else -0.02
    competition_adj = -0.08 if competition_index > 1.5 else (0.03 if competition_index < 0.5 else 0)
    survival_probability = max(0.1, min(0.95, base_survival + floating_adj + pop_adj + competition_adj))

    # Z-score 기반 개별 점수
    def z_to_score(value: float, avg: float, higher_is_better: bool = True) -> float:
        if avg == 0:
            return 50
        z = (value - avg) / max(avg * 0.5, 1)
        score = 50 + z * 20
        if not higher_is_better:
            score = 100 - score
        return max(0, min(100, score))

    floating_score = z_to_score(total_floating, seoul_avg["avg_floating"])
    population_score = z_to_score(total_pop, seoul_avg["avg_population"])
    rent_score = z_to_score(rent_per_m2, seoul_avg["avg_rent"], higher_is_better=False)
    sales_score = z_to_score(quarterly_sales, seoul_avg["avg_sales"])

    # Health Score (가중합)
    weights = {
        "competition": -0.25,
        "survival": 0.20,
        "floating": 0.20,
        "population": 0.15,
        "sales": 0.15,
        "rent": -0.05,
    }
    health_score = (
        (100 - min(competition_index * 50, 100)) * abs(weights["competition"])
        + survival_probability * 100 * weights["survival"]
        + floating_score * weights["floating"]
        + population_score * weights["population"]
        + sales_score * weights["sales"]
        + rent_score * abs(weights["rent"])
    ) / sum(abs(v) for v in weights.values())
    health_score = max(0, min(100, health_score))

    # 매출 추정
    monthly_sales = quarterly_sales / 3 if quarterly_sales else 0
    sales_estimate_low = monthly_sales * 0.7 / 10000
    sales_estimate_high = monthly_sales * 1.3 / 10000

    # 리스크
    risks = []
    if competition_index > 2.0:
        risks.append({"level": "danger", "message": "과밀 상권: 동일 업종 경쟁이 매우 치열합니다"})
    elif competition_index > 1.5:
        risks.append({"level": "warning", "message": "경쟁 주의: 동일 업종 점포가 평균보다 많습니다"})
    if rent_per_m2 > seoul_avg["avg_rent"] * 1.5:
        risks.append({"level": "warning", "message": "높은 임대료: 서울 평균 대비 1.5배 이상입니다"})
    if total_floating < seoul_avg["avg_floating"] * 0.5:
        risks.append({"level": "warning", "message": "낮은 유동인구: 서울 평균의 50% 미만입니다"})
    if closure_rate > 0.25:
        risks.append({"level": "danger", "message": "높은 폐업률: 해당 업종 폐업률이 25%를 초과합니다"})

    return {
        "gid": grid_id,
        "ic": industry_code,
        "hs": round(health_score, 1),
        "ci": round(competition_index, 3),
        "sp": round(survival_probability, 3),
        "sl": round(sales_estimate_low, 0),
        "sh": round(sales_estimate_high, 0),
        "ps": round(population_score, 1),
        "fs": round(floating_score, 1),
        "rs": round(rent_score, 1),
        "rf": json.dumps(risks, ensure_ascii=False),
        "q": "2024-Q3",
    }


def _insert_batch(session: Session, batch: list[dict]):
    """점수 배치 INSERT."""
    for score in batch:
        session.execute(text("""
            INSERT INTO grid_score
                (grid_id, industry_code, health_score, competition_index,
                 survival_probability, sales_estimate_low, sales_estimate_high,
                 population_score, floating_score, rent_score,
                 risk_flags, snapshot_quarter)
            VALUES
                (:gid, :ic, :hs, :ci, :sp, :sl, :sh, :ps, :fs, :rs, :rf, :q)
        """), score)
