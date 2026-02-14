"""점포 데이터 수집 (소상공인진흥공단 상가업소정보)."""
import json
from datetime import date
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.etl.api_client import fetch_json
from app.etl.logger import get_etl_logger

logger = get_etl_logger("store_collector")
SAMPLE_DIR = Path(__file__).parent / "sample_data"


def collect_stores(session: Session) -> int:
    settings = get_settings()
    if settings.should_use_sample or not settings.has_key("data_go_kr"):
        logger.info("Using sample data for stores")
        return _load_sample(session)
    logger.info("Collecting stores from API")
    return _collect_from_api(session, settings.DATA_GO_KR_API_KEY)


def _collect_from_api(session: Session, api_key: str) -> int:
    """소상공인진흥공단 API에서 서울 점포 데이터 수집."""
    base_url = "https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInDong"
    gu_codes = [
        "11110", "11140", "11170", "11200", "11215", "11230", "11260",
        "11290", "11305", "11320", "11350", "11380", "11410", "11440",
        "11470", "11500", "11530", "11545", "11560", "11590", "11620",
        "11650", "11680", "11710", "11740",
    ]

    count = 0
    today = date.today()

    for gu_code in gu_codes:
        page = 1
        gu_count = 0
        while True:
            data = fetch_json(base_url, params={
                "serviceKey": api_key,
                "divId": "signguCd",
                "key": gu_code,
                "numOfRows": 1000,
                "pageNo": page,
                "type": "json",
            })
            if not data:
                logger.warning("No response for gu_code=%s page=%d, skipping", gu_code, page)
                break

            items = data.get("body", {}).get("items", [])
            if not items:
                break

            for item in items:
                lat = item.get("lat")
                lng = item.get("lon")
                if not lat or not lng:
                    continue
                try:
                    session.execute(text("""
                        INSERT INTO store_master
                            (store_name, industry_code, industry_name, address,
                             lat, lng, geom, is_active, snapshot_date)
                        VALUES
                            (:name, :code, :ind_name, :addr,
                             :lat, :lng, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                             1, :snap_date)
                    """), {
                        "name": item.get("bizesNm", ""),
                        "code": item.get("indsLclsCd", ""),
                        "ind_name": item.get("indsLclsNm", ""),
                        "addr": item.get("lnoAdr", ""),
                        "lat": float(lat),
                        "lng": float(lng),
                        "snap_date": today,
                    })
                    count += 1
                    gu_count += 1
                except Exception as e:
                    logger.warning("Failed to insert store: %s", e)

            if len(items) < 1000:
                break
            page += 1

        logger.info("gu_code=%s: %d stores collected", gu_code, gu_count)

    session.commit()
    _assign_grid_ids(session)
    _compute_store_stats(session)
    logger.info("Total stores collected: %d", count)
    return count


def _load_sample(session: Session) -> int:
    """샘플 데이터 적재."""
    sample_file = SAMPLE_DIR / "stores.json"
    with open(sample_file, "r", encoding="utf-8") as f:
        stores = json.load(f)

    today = date.today()
    for s in stores:
        session.execute(text("""
            INSERT INTO store_master
                (store_name, industry_code, industry_name, address,
                 lat, lng, geom, is_active, snapshot_date)
            VALUES
                (:name, :code, :ind_name, :addr,
                 :lat, :lng, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                 :active, :snap_date)
        """), {
            "name": s["store_name"],
            "code": s["industry_code"],
            "ind_name": s["industry_name"],
            "addr": s["address"],
            "lat": s["lat"],
            "lng": s["lng"],
            "active": s.get("is_active", 1),
            "snap_date": today,
        })

    session.commit()
    _assign_grid_ids(session)
    _compute_store_stats(session)
    logger.info("Sample stores loaded: %d", len(stores))
    return len(stores)


def _assign_grid_ids(session: Session):
    """점포를 가장 가까운 Grid에 배정."""
    session.execute(text("""
        UPDATE store_master s
        SET grid_id = g.id
        FROM grid_master g
        WHERE ST_Contains(g.geom, s.geom)
    """))
    session.commit()


def _compute_store_stats(session: Session):
    """grid_store_stats 집계."""
    session.execute(text("DELETE FROM grid_store_stats"))
    session.execute(text("""
        INSERT INTO grid_store_stats (grid_id, industry_code, store_count, snapshot_quarter)
        SELECT grid_id, industry_code, COUNT(*), TO_CHAR(NOW(), 'YYYY-"Q"Q')
        FROM store_master
        WHERE grid_id IS NOT NULL AND is_active = 1
        GROUP BY grid_id, industry_code
    """))
    session.commit()
