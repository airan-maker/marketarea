"""반경 기반 Grid 집계 서비스."""
import json
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def aggregate_grids(
    session: AsyncSession,
    lat: float,
    lng: float,
    radius: int,
    industry_code: str,
) -> dict:
    """주어진 좌표 반경 내 Grid들을 집계하여 분석 결과를 반환한다."""

    # 반경 내 Grid ID 추출 (ST_DWithin은 degree 단위이므로 미터 변환)
    # 대략 1도 ≈ 111,320m
    radius_deg = radius / 111_320

    grid_rows = await session.execute(text("""
        SELECT id FROM grid_master
        WHERE ST_DWithin(
            geom,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
            :radius_deg
        )
    """), {"lat": lat, "lng": lng, "radius_deg": radius_deg})

    grid_ids = [r[0] for r in grid_rows.fetchall()]

    if not grid_ids:
        return _empty_result()

    grid_id_list = ",".join(str(gid) for gid in grid_ids)

    # 점포 수
    store_row = await session.execute(text(f"""
        SELECT COALESCE(SUM(store_count), 0)
        FROM grid_store_stats
        WHERE grid_id IN ({grid_id_list}) AND industry_code = :ic
    """), {"ic": industry_code})
    store_count = store_row.scalar() or 0

    # 유동인구 평균
    floating_row = await session.execute(text(f"""
        SELECT COALESCE(AVG(total_floating), 0)
        FROM grid_floating_stats
        WHERE grid_id IN ({grid_id_list})
    """))
    avg_floating = floating_row.scalar() or 0

    # 거주인구 합계
    pop_row = await session.execute(text(f"""
        SELECT COALESCE(SUM(total_population), 0)
        FROM grid_population_stats
        WHERE grid_id IN ({grid_id_list})
    """))
    total_pop = pop_row.scalar() or 0

    # 임대료 평균
    rent_row = await session.execute(text(f"""
        SELECT COALESCE(AVG(rent_per_m2), 0)
        FROM grid_rent_stats
        WHERE grid_id IN ({grid_id_list})
    """))
    avg_rent = rent_row.scalar() or 0

    # Grid Score 가중 평균
    score_row = await session.execute(text(f"""
        SELECT
            AVG(health_score),
            AVG(competition_index),
            AVG(survival_probability),
            AVG(sales_estimate_low),
            AVG(sales_estimate_high),
            AVG(population_score),
            AVG(floating_score),
            AVG(rent_score)
        FROM grid_score
        WHERE grid_id IN ({grid_id_list}) AND industry_code = :ic
    """), {"ic": industry_code})

    score = score_row.fetchone()

    # 리스크 플래그 집계
    risk_rows = await session.execute(text(f"""
        SELECT risk_flags FROM grid_score
        WHERE grid_id IN ({grid_id_list}) AND industry_code = :ic
        AND risk_flags IS NOT NULL AND risk_flags != '[]'
    """), {"ic": industry_code})

    risk_flags = []
    seen_messages = set()
    for (rf_json,) in risk_rows.fetchall():
        try:
            flags = json.loads(rf_json)
            for f in flags:
                if f["message"] not in seen_messages:
                    risk_flags.append(f)
                    seen_messages.add(f["message"])
        except (json.JSONDecodeError, KeyError):
            pass

    if score and score[0] is not None:
        return {
            "health_score": round(float(score[0]), 1),
            "competition_index": round(float(score[1]), 3),
            "survival_probability": round(float(score[2]), 3),
            "sales_estimate_low": round(float(score[3]), 0),
            "sales_estimate_high": round(float(score[4]), 0),
            "store_count": int(store_count),
            "floating_population": round(float(avg_floating), 0),
            "resident_population": int(total_pop),
            "avg_rent_per_m2": round(float(avg_rent), 0),
            "population_score": round(float(score[5]), 1),
            "floating_score": round(float(score[6]), 1),
            "rent_score": round(float(score[7]), 1),
            "risk_flags": risk_flags,
            "grid_count": len(grid_ids),
        }

    # Grid Score가 아직 계산되지 않은 경우 기본 결과
    return {
        "health_score": 50.0,
        "competition_index": store_count / max(len(grid_ids), 1),
        "survival_probability": 0.75,
        "sales_estimate_low": 0,
        "sales_estimate_high": 0,
        "store_count": int(store_count),
        "floating_population": round(float(avg_floating), 0),
        "resident_population": int(total_pop),
        "avg_rent_per_m2": round(float(avg_rent), 0),
        "population_score": 50.0,
        "floating_score": 50.0,
        "rent_score": 50.0,
        "risk_flags": [],
        "grid_count": len(grid_ids),
    }


def _empty_result() -> dict:
    return {
        "health_score": 0,
        "competition_index": 0,
        "survival_probability": 0,
        "sales_estimate_low": 0,
        "sales_estimate_high": 0,
        "store_count": 0,
        "floating_population": 0,
        "resident_population": 0,
        "avg_rent_per_m2": 0,
        "population_score": 0,
        "floating_score": 0,
        "rent_score": 0,
        "risk_flags": [{"level": "warning", "message": "해당 위치에 분석 데이터가 없습니다"}],
        "grid_count": 0,
    }
