"""카드매출 데이터 수집 (서울시 상권분석 추정매출)."""
import json
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.etl.api_client import fetch_json
from app.etl.logger import get_etl_logger
from app.etl.seoul_districts import get_grid_ids_for_gu, GU_CODES

logger = get_etl_logger("sales_collector")
SAMPLE_DIR = Path(__file__).parent / "sample_data"


def collect_sales(session: Session) -> int:
    settings = get_settings()
    if settings.should_use_sample or not settings.has_key("seoul"):
        logger.info("Using sample data for sales")
        return _load_sample(session)
    logger.info("Collecting sales from API")
    return _collect_from_api(session, settings.SEOUL_OPEN_DATA_API_KEY)


def _collect_from_api(session: Session, api_key: str) -> int:
    """서울시 상권분석 추정매출 API (OA-15572)."""
    base_url = f"http://openapi.seoul.go.kr:8088/{api_key}/json/VwsmTrdarSelngQq"
    count = 0
    start = 1

    session.execute(text("DELETE FROM grid_sales_stats"))

    # 구별 grid_id 캐시 (매번 쿼리하지 않도록)
    gu_grids_cache: dict[str, list[int]] = {}
    # grid별 합산 딕셔너리: (grid_id, ind_code, quarter) -> {sales, cnt, ticket}
    grid_sales_agg: dict[tuple, dict] = {}

    while True:
        end = start + 999
        data = fetch_json(f"{base_url}/{start}/{end}/")
        if not data:
            logger.warning("No response for sales API at offset %d", start)
            break

        result = data.get("VwsmTrdarSelngQq", {})
        items = result.get("row", [])
        if not items:
            break

        logger.info("Processing sales batch: rows %d-%d (%d items)", start, end, len(items))

        # 구 단위로 집계 후 grid에 배분
        # 상권코드(TRDAR_CD) 앞 5자리가 구 코드에 대응하지 않으므로,
        # 상권코드 → 구 매핑은 별도 API가 필요. 대안: 전체를 구 균등 배분 대신
        # 상권코드별 데이터를 구 단위 집계 후 배분
        gu_sales: dict[str, dict[str, dict]] = {}  # gu_code -> ind_code -> {sales, cnt}

        for item in items:
            trdar_cd = item.get("TRDAR_CD", "")
            ind_code = item.get("SVC_INDUTY_CD", "")
            sales = float(item.get("THSMON_SELNG_AMT", 0))
            sales_cnt = int(item.get("THSMON_SELNG_CO", 0))
            quarter = item.get("STDR_YYQU_CD", "")

            # 상권코드에서 구 코드 추출 시도 (앞 5자리)
            gu_code = trdar_cd[:5] if len(trdar_cd) >= 5 else ""
            if gu_code not in GU_CODES:
                # 구 코드로 매핑 안 되면 전체 서울 균등 배분용으로 모음
                gu_code = "11000"  # placeholder for citywide

            key = f"{gu_code}_{ind_code}_{quarter}"
            if gu_code not in gu_sales:
                gu_sales[gu_code] = {}
            if ind_code not in gu_sales[gu_code]:
                gu_sales[gu_code][ind_code] = {
                    "sales": 0.0, "cnt": 0, "quarter": quarter,
                }
            gu_sales[gu_code][ind_code]["sales"] += sales
            gu_sales[gu_code][ind_code]["cnt"] += sales_cnt

        # 구별로 grid에 배분 → grid별 합산 딕셔너리에 축적
        for gu_code, industries in gu_sales.items():
            if gu_code == "11000":
                continue

            if gu_code not in gu_grids_cache:
                gu_grids_cache[gu_code] = get_grid_ids_for_gu(session, gu_code)
            grids = gu_grids_cache[gu_code]
            if not grids:
                continue

            for ind_code, agg in industries.items():
                total_sales = agg["sales"]
                total_cnt = agg["cnt"]
                quarter = agg["quarter"]
                per_grid_sales = total_sales / len(grids)
                per_grid_cnt = max(total_cnt // len(grids), 1)
                avg_ticket = total_sales / total_cnt if total_cnt > 0 else 0

                for grid_id in grids:
                    key = (grid_id, ind_code, quarter)
                    if key not in grid_sales_agg:
                        grid_sales_agg[key] = {"sales": 0.0, "cnt": 0, "ticket": avg_ticket}
                    grid_sales_agg[key]["sales"] += per_grid_sales
                    grid_sales_agg[key]["cnt"] += per_grid_cnt

        if len(items) < 1000:
            break
        start += 1000

    # 합산된 데이터를 INSERT
    for (grid_id, ind_code, quarter), agg in grid_sales_agg.items():
        session.execute(text("""
            INSERT INTO grid_sales_stats
                (grid_id, industry_code, quarterly_sales,
                 quarterly_count, avg_ticket_price, snapshot_quarter)
            VALUES (:gid, :code, :sales, :cnt, :ticket, :q)
        """), {
            "gid": grid_id,
            "code": ind_code,
            "sales": agg["sales"],
            "cnt": agg["cnt"],
            "ticket": agg["ticket"],
            "q": quarter,
        })
        count += 1

    session.commit()
    logger.info("Sales data mapped to %d grid entries", count)
    return count


def _load_sample(session: Session) -> int:
    """샘플 매출 데이터 적재."""
    sample_file = SAMPLE_DIR / "sales.json"
    with open(sample_file, "r", encoding="utf-8") as f:
        records = json.load(f)

    session.execute(text("DELETE FROM grid_sales_stats"))

    for r in records:
        session.execute(text("""
            INSERT INTO grid_sales_stats
                (grid_id, industry_code, quarterly_sales,
                 quarterly_count, avg_ticket_price, sales_per_store,
                 snapshot_quarter)
            VALUES (:gid, :code, :sales, :cnt, :ticket, :sps, :q)
        """), {
            "gid": r["grid_id"],
            "code": r["industry_code"],
            "sales": r["quarterly_sales"],
            "cnt": r["quarterly_count"],
            "ticket": r["avg_ticket_price"],
            "sps": r.get("sales_per_store", 0),
            "q": r["snapshot_quarter"],
        })

    session.commit()
    logger.info("Sample sales data loaded: %d records", len(records))
    return len(records)
