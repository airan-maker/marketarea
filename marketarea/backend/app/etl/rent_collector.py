"""임대료 데이터 수집 (한국부동산원 임대동향)."""
import json
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.etl.api_client import fetch_json
from app.etl.logger import get_etl_logger
from app.etl.seoul_districts import get_grid_ids_for_gu, GU_CODES

logger = get_etl_logger("rent_collector")
SAMPLE_DIR = Path(__file__).parent / "sample_data"


def collect_rent(session: Session) -> int:
    settings = get_settings()
    if settings.should_use_sample or not settings.has_key("data_go_kr"):
        logger.info("Using sample data for rent")
        return _load_sample(session)
    logger.info("Collecting rent from API")
    return _collect_from_api(session, settings.DATA_GO_KR_API_KEY)


def _collect_from_api(session: Session, api_key: str) -> int:
    """한국부동산원 임대동향 API (data.go.kr/15002275)."""
    base_url = "https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent"
    count = 0

    session.execute(text("DELETE FROM grid_rent_stats"))

    # 구별 grid_id 캐시
    gu_grids_cache: dict[str, list[int]] = {}

    for gu_code in GU_CODES:
        data = fetch_json(base_url, params={
            "serviceKey": api_key,
            "LAWD_CD": gu_code,
            "DEAL_YMD": "202401",
            "numOfRows": 1000,
            "type": "json",
        })

        if not data:
            logger.warning("No response for rent gu_code=%s, skipping", gu_code)
            continue

        items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
        if not isinstance(items, list):
            items = [items] if items else []

        if not items:
            logger.debug("No rent items for gu_code=%s", gu_code)
            continue

        # 구 단위 집계
        total_rent = 0.0
        total_deposit = 0.0
        total_area = 0.0
        item_count = 0

        for item in items:
            rent = float(item.get("월세금액", 0)) * 10000
            deposit = float(item.get("보증금액", 0)) * 10000
            area = float(item.get("전용면적", 0))
            if area <= 0:
                continue
            total_rent += rent
            total_deposit += deposit
            total_area += area
            item_count += 1

        if item_count == 0 or total_area == 0:
            continue

        avg_rent_per_m2 = total_rent / total_area
        avg_deposit_per_m2 = total_deposit / total_area

        # 구에 속한 grid들에 균등 배분
        if gu_code not in gu_grids_cache:
            gu_grids_cache[gu_code] = get_grid_ids_for_gu(session, gu_code)
        grids = gu_grids_cache[gu_code]

        if not grids:
            logger.debug("No grids for gu_code=%s", gu_code)
            continue

        for grid_id in grids:
            session.execute(text("""
                INSERT INTO grid_rent_stats
                    (grid_id, rent_per_m2, deposit_per_m2,
                     rent_price_index, snapshot_quarter)
                VALUES (:gid, :rent, :dep, 100.0, :q)
            """), {
                "gid": grid_id,
                "rent": avg_rent_per_m2,
                "dep": avg_deposit_per_m2,
                "q": "2024-Q1",
            })
            count += 1

        logger.info("gu_code=%s: %d items → %d grids, avg_rent=%.0f/m2",
                     gu_code, item_count, len(grids), avg_rent_per_m2)

    session.commit()
    logger.info("Rent data mapped to %d grid entries", count)
    return count


def _load_sample(session: Session) -> int:
    """샘플 임대료 데이터 적재."""
    sample_file = SAMPLE_DIR / "rent.json"
    with open(sample_file, "r", encoding="utf-8") as f:
        records = json.load(f)

    session.execute(text("DELETE FROM grid_rent_stats"))

    for r in records:
        session.execute(text("""
            INSERT INTO grid_rent_stats
                (grid_id, rent_per_m2, deposit_per_m2,
                 rent_price_index, snapshot_quarter)
            VALUES (:gid, :rent, :dep, :idx, :q)
        """), {
            "gid": r["grid_id"],
            "rent": r["rent_per_m2"],
            "dep": r["deposit_per_m2"],
            "idx": r["rent_price_index"],
            "q": r["snapshot_quarter"],
        })

    session.commit()
    logger.info("Sample rent data loaded: %d records", len(records))
    return len(records)
