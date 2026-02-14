"""유동인구 데이터 수집 (서울 생활인구)."""
import json
from datetime import date
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.etl.api_client import fetch_json
from app.etl.logger import get_etl_logger
from app.etl.seoul_districts import get_grid_ids_for_dong

logger = get_etl_logger("floating_collector")
SAMPLE_DIR = Path(__file__).parent / "sample_data"


def collect_floating(session: Session) -> int:
    settings = get_settings()
    if settings.should_use_sample or not settings.has_key("seoul"):
        logger.info("Using sample data for floating population")
        return _load_sample(session)
    logger.info("Collecting floating population from API")
    return _collect_from_api(session, settings.SEOUL_OPEN_DATA_API_KEY)


def _collect_from_api(session: Session, api_key: str) -> int:
    """서울 생활인구 API (OA-14991)에서 유동인구 수집."""
    base_url = f"http://openapi.seoul.go.kr:8088/{api_key}/json/SPOP_LOCAL_RESD_DONG"
    count = 0

    data = fetch_json(f"{base_url}/1/1000/")
    if not data:
        logger.error("Failed to fetch floating population data")
        return 0

    items = data.get("SPOP_LOCAL_RESD_DONG", {}).get("row", [])
    if not items:
        logger.warning("No floating population rows in API response")
        return 0

    logger.info("Fetched %d floating population rows from API", len(items))

    # 행정동별 집계
    dong_data: dict[str, dict] = {}
    for item in items:
        dong_code = item.get("ADSTRD_CODE_SE", "")
        if not dong_code:
            continue
        if dong_code not in dong_data:
            dong_data[dong_code] = {"total": 0.0, "cnt": 0}
        total = float(item.get("TOT_LVPOP_CO", 0))
        dong_data[dong_code]["total"] += total
        dong_data[dong_code]["cnt"] += 1

    logger.info("Aggregated data for %d dongs", len(dong_data))

    session.execute(text("DELETE FROM grid_floating_stats"))

    # 행정동 중심 좌표 기반으로 가까운 grid에 배분
    # 먼저 grid별로 합산 (여러 동이 같은 grid에 매핑될 수 있음)
    grid_agg: dict[int, dict] = {}  # grid_id -> {total, wd, we}

    for dong_code, d in dong_data.items():
        avg_total = d["total"] / max(d["cnt"], 1)
        grids = get_grid_ids_for_dong(session, dong_code)

        if not grids:
            logger.debug("No grids found for dong_code=%s, skipping", dong_code)
            continue

        per_grid = avg_total / len(grids)
        for grid_id in grids:
            if grid_id not in grid_agg:
                grid_agg[grid_id] = {"total": 0.0, "wd": 0.0, "we": 0.0}
            grid_agg[grid_id]["total"] += per_grid
            grid_agg[grid_id]["wd"] += per_grid * 0.7
            grid_agg[grid_id]["we"] += per_grid * 0.3

    # 합산된 데이터를 INSERT
    today = date.today()
    for grid_id, agg in grid_agg.items():
        session.execute(text("""
            INSERT INTO grid_floating_stats
                (grid_id, total_floating, lunch_ratio, dinner_ratio,
                 night_ratio, weekday_avg, weekend_avg, snapshot_date)
            VALUES (:gid, :total, 0.35, 0.30, 0.10, :wd, :we, :sd)
        """), {
            "gid": grid_id, "total": agg["total"],
            "wd": agg["wd"], "we": agg["we"],
            "sd": today,
        })
        count += 1

    session.commit()
    logger.info("Floating population mapped to %d grid entries", count)
    return count


def _load_sample(session: Session) -> int:
    """샘플 유동인구 데이터 적재."""
    sample_file = SAMPLE_DIR / "floating.json"
    with open(sample_file, "r", encoding="utf-8") as f:
        records = json.load(f)

    session.execute(text("DELETE FROM grid_floating_stats"))

    for r in records:
        session.execute(text("""
            INSERT INTO grid_floating_stats
                (grid_id, total_floating, lunch_ratio, dinner_ratio,
                 night_ratio, weekday_avg, weekend_avg, snapshot_date)
            VALUES (:gid, :total, :lunch, :dinner, :night, :wd, :we, :sd)
        """), {
            "gid": r["grid_id"],
            "total": r["total_floating"],
            "lunch": r["lunch_ratio"],
            "dinner": r["dinner_ratio"],
            "night": r["night_ratio"],
            "wd": r["weekday_avg"],
            "we": r["weekend_avg"],
            "sd": date.today(),
        })

    session.commit()
    logger.info("Sample floating data loaded: %d records", len(records))
    return len(records)
