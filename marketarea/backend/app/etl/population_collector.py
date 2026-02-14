"""인구 구조 데이터 수집 (KOSIS + 공공데이터포털)."""
import json
from datetime import date
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.etl.api_client import fetch_json
from app.etl.logger import get_etl_logger
from app.etl.seoul_districts import get_grid_ids_for_dong, get_grid_ids_for_gu, SEOUL_GU

logger = get_etl_logger("population_collector")
SAMPLE_DIR = Path(__file__).parent / "sample_data"


def collect_population(session: Session) -> int:
    settings = get_settings()
    if settings.should_use_sample or not settings.has_key("kosis"):
        logger.info("Using sample data for population")
        return _load_sample(session)
    logger.info("Collecting population from API")
    return _collect_from_api(session, settings.KOSIS_API_KEY)


def _collect_from_api(session: Session, api_key: str) -> int:
    """KOSIS API에서 읍면동별 인구 데이터 수집."""
    base_url = "https://kosis.kr/openapi/Param/statisticsParameterData.do"
    count = 0

    data = fetch_json(base_url, params={
        "method": "getList",
        "apiKey": api_key,
        "itmId": "T20",
        "objL1": "ALL",
        "objL2": "ALL",
        "format": "json",
        "jsonVD": "Y",
        "prdSe": "M",
        "startPrdDe": "202401",
        "endPrdDe": "202412",
        "orgId": "101",
        "tblId": "DT_1B04005N",
    })

    if not data:
        logger.error("Failed to fetch population data from KOSIS")
        return 0

    items = data if isinstance(data, list) else []
    if not items:
        logger.warning("No population data rows from KOSIS")
        return 0

    logger.info("Fetched %d population rows from KOSIS", len(items))

    # 행정동별 연령대 인구 집계
    dong_pop: dict[str, dict] = {}
    for item in items:
        dong = item.get("C1_NM", "")
        age_group = item.get("C2_NM", "")
        pop = int(item.get("DT", 0))

        if not dong:
            continue
        if dong not in dong_pop:
            dong_pop[dong] = {"total": 0, "age_20_39": 0, "age_40_59": 0, "age_60_plus": 0}
        dong_pop[dong]["total"] += pop
        if age_group and len(age_group) >= 2:
            prefix = age_group[:2]
            if "20" <= prefix <= "39":
                dong_pop[dong]["age_20_39"] += pop
            elif "40" <= prefix <= "59":
                dong_pop[dong]["age_40_59"] += pop
            elif prefix >= "60":
                dong_pop[dong]["age_60_plus"] += pop

    logger.info("Aggregated population for %d areas", len(dong_pop))

    session.execute(text("DELETE FROM grid_population_stats"))

    # 동 이름 → 구 단위로 매핑하여 grid에 배분
    # 먼저 grid별로 합산 (여러 동/구가 같은 grid에 매핑될 수 있음)
    grid_agg: dict[int, dict] = {}

    for dong_name, d in dong_pop.items():
        total = max(d["total"], 1)
        grids = []

        # 구 이름으로 직접 매칭 시도
        for gu_code, gu_info in SEOUL_GU.items():
            if gu_info["name"] == dong_name or dong_name.startswith(gu_info["name"]):
                grids = get_grid_ids_for_gu(session, gu_code)
                break

        if not grids:
            logger.debug("No grids found for dong_name=%s, skipping", dong_name)
            continue

        per_grid = total // max(len(grids), 1)
        r1 = d["age_20_39"] / total
        r2 = d["age_40_59"] / total
        r3 = d["age_60_plus"] / total

        for grid_id in grids:
            if grid_id not in grid_agg:
                grid_agg[grid_id] = {"total": 0, "r1": r1, "r2": r2, "r3": r3}
            grid_agg[grid_id]["total"] += per_grid

    # 합산된 데이터를 INSERT
    today = date.today()
    for grid_id, agg in grid_agg.items():
        session.execute(text("""
            INSERT INTO grid_population_stats
                (grid_id, total_population, age_20_39_ratio,
                 age_40_59_ratio, age_60_plus_ratio,
                 household_1_2_ratio, snapshot_date)
            VALUES (:gid, :total, :r1, :r2, :r3, 0.40, :sd)
        """), {
            "gid": grid_id, "total": agg["total"],
            "r1": agg["r1"], "r2": agg["r2"], "r3": agg["r3"],
            "sd": today,
        })
        count += 1

    session.commit()
    logger.info("Population mapped to %d grid entries", count)
    return count


def _load_sample(session: Session) -> int:
    """샘플 인구 데이터 적재."""
    sample_file = SAMPLE_DIR / "population.json"
    with open(sample_file, "r", encoding="utf-8") as f:
        records = json.load(f)

    session.execute(text("DELETE FROM grid_population_stats"))

    for r in records:
        session.execute(text("""
            INSERT INTO grid_population_stats
                (grid_id, total_population, age_20_39_ratio,
                 age_40_59_ratio, age_60_plus_ratio,
                 household_1_2_ratio, snapshot_date)
            VALUES (:gid, :total, :r1, :r2, :r3, :h12, :sd)
        """), {
            "gid": r["grid_id"],
            "total": r["total_population"],
            "r1": r["age_20_39_ratio"],
            "r2": r["age_40_59_ratio"],
            "r3": r["age_60_plus_ratio"],
            "h12": r["household_1_2_ratio"],
            "sd": date.today(),
        })

    session.commit()
    logger.info("Sample population data loaded: %d records", len(records))
    return len(records)
