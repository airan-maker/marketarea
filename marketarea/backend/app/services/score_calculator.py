"""점수 계산 엔진 — 건강도, 경쟁지수, 생존확률 등."""
import json
import math
from sqlalchemy import text
from sqlalchemy.orm import Session


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

# Health Score 가중치
WEIGHTS = {
    "competition": -0.25,  # 경쟁 높을수록 감점
    "survival": 0.20,
    "floating": 0.20,
    "population": 0.15,
    "sales": 0.15,
    "rent": -0.05,  # 임대료 높을수록 감점
}


def compute_all_scores(session: Session) -> int:
    """모든 Grid × 업종 조합에 대해 점수를 계산한다."""
    session.execute(text("DELETE FROM grid_score"))

    # 업종 목록 추출
    industries = session.execute(text(
        "SELECT DISTINCT industry_code FROM grid_store_stats"
    )).fetchall()

    grids = session.execute(text(
        "SELECT id FROM grid_master"
    )).fetchall()

    # 서울 전체 평균값 계산
    seoul_avg = _compute_seoul_averages(session)

    count = 0
    for (grid_id,) in grids:
        for (industry_code,) in industries:
            score = _compute_grid_score(session, grid_id, industry_code, seoul_avg)
            if score:
                session.execute(text("""
                    INSERT INTO grid_score
                        (grid_id, industry_code, health_score, competition_index,
                         survival_probability, sales_estimate_low, sales_estimate_high,
                         population_score, floating_score, rent_score,
                         risk_flags, snapshot_quarter)
                    VALUES
                        (:gid, :ic, :hs, :ci, :sp, :sl, :sh, :ps, :fs, :rs, :rf, :q)
                """), score)
                count += 1

    session.commit()
    return count


def _compute_seoul_averages(session: Session) -> dict:
    """서울 전체 평균 통계."""
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


def _compute_grid_score(
    session: Session, grid_id: int, industry_code: str, seoul_avg: dict
) -> dict | None:
    """단일 Grid × 업종에 대한 점수 계산."""
    # 점포 통계
    store_row = session.execute(text("""
        SELECT store_count, closure_rate FROM grid_store_stats
        WHERE grid_id = :gid AND industry_code = :ic
    """), {"gid": grid_id, "ic": industry_code}).fetchone()

    store_count = store_row[0] if store_row else 0
    closure_rate = store_row[1] if store_row and store_row[1] else \
        DEFAULT_CLOSURE_RATES.get(industry_code, 0.20)

    # 유동인구
    floating_row = session.execute(text("""
        SELECT total_floating, lunch_ratio, dinner_ratio
        FROM grid_floating_stats WHERE grid_id = :gid
        ORDER BY snapshot_date DESC LIMIT 1
    """), {"gid": grid_id}).fetchone()

    total_floating = floating_row[0] if floating_row else 0

    # 거주인구
    pop_row = session.execute(text("""
        SELECT total_population, age_20_39_ratio, household_1_2_ratio
        FROM grid_population_stats WHERE grid_id = :gid
        ORDER BY snapshot_date DESC LIMIT 1
    """), {"gid": grid_id}).fetchone()

    total_pop = pop_row[0] if pop_row else 0

    # 매출
    sales_row = session.execute(text("""
        SELECT quarterly_sales, avg_ticket_price, sales_per_store
        FROM grid_sales_stats
        WHERE grid_id = :gid AND industry_code = :ic
        ORDER BY snapshot_quarter DESC LIMIT 1
    """), {"gid": grid_id, "ic": industry_code}).fetchone()

    quarterly_sales = sales_row[0] if sales_row else 0

    # 임대료
    rent_row = session.execute(text("""
        SELECT rent_per_m2, rent_price_index
        FROM grid_rent_stats WHERE grid_id = :gid
        ORDER BY snapshot_quarter DESC LIMIT 1
    """), {"gid": grid_id}).fetchone()

    rent_per_m2 = rent_row[0] if rent_row else 0

    # === 지표 계산 ===

    # Competition Index = 동일업종 점포수 / 서울평균
    competition_index = store_count / seoul_avg["avg_stores"] if seoul_avg["avg_stores"] else 0

    # Survival Probability
    base_survival = 1 - closure_rate
    floating_adj = 0.05 if total_floating > seoul_avg["avg_floating"] else -0.03
    pop_adj = 0.03 if total_pop > seoul_avg["avg_population"] else -0.02
    competition_adj = -0.08 if competition_index > 1.5 else (0.03 if competition_index < 0.5 else 0)
    survival_probability = max(0.1, min(0.95, base_survival + floating_adj + pop_adj + competition_adj))

    # Z-score 기반 개별 점수 (0~100 정규화)
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
    health_score = (
        (100 - min(competition_index * 50, 100)) * abs(WEIGHTS["competition"])
        + survival_probability * 100 * WEIGHTS["survival"]
        + floating_score * WEIGHTS["floating"]
        + population_score * WEIGHTS["population"]
        + sales_score * WEIGHTS["sales"]
        + rent_score * abs(WEIGHTS["rent"])
    ) / sum(abs(v) for v in WEIGHTS.values())

    health_score = max(0, min(100, health_score))

    # 매출 추정 (월 기준)
    monthly_sales = quarterly_sales / 3 if quarterly_sales else 0
    sales_estimate_low = monthly_sales * 0.7 / 10000   # 만원 단위
    sales_estimate_high = monthly_sales * 1.3 / 10000

    # 리스크 경고
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
