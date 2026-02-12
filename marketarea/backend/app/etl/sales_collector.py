"""카드매출 데이터 수집 (서울시 상권분석 추정매출)."""
import json
from pathlib import Path

import httpx
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings

SAMPLE_DIR = Path(__file__).parent / "sample_data"


def collect_sales(session: Session) -> int:
    settings = get_settings()
    if settings.should_use_sample or not settings.has_key("seoul"):
        return _load_sample(session)
    return _collect_from_api(session, settings.SEOUL_OPEN_DATA_API_KEY)


def _collect_from_api(session: Session, api_key: str) -> int:
    """서울시 상권분석 추정매출 API (OA-15572)."""
    base_url = f"http://openapi.seoul.go.kr:8088/{api_key}/json/VwsmTrdarSelngQq"
    count = 0
    start = 1

    while True:
        end = start + 999
        resp = httpx.get(f"{base_url}/{start}/{end}/", timeout=30)
        data = resp.json()
        items = data.get("VwsmTrdarSelngQq", {}).get("row", [])
        if not items:
            break

        for item in items:
            trdar_cd = item.get("TRDAR_CD", "")
            ind_code = item.get("SVC_INDUTY_CD", "")
            sales = float(item.get("THSMON_SELNG_AMT", 0))
            cnt = int(item.get("THSMON_SELNG_CO", 0))
            avg_ticket = sales / cnt if cnt > 0 else 0

            # 상권코드 → 가장 가까운 Grid 매핑 (간소화)
            grid_row = session.execute(text("""
                SELECT gm.id FROM grid_master gm
                ORDER BY gm.id
                LIMIT 1
            """)).fetchone()

            if grid_row:
                session.execute(text("""
                    INSERT INTO grid_sales_stats
                        (grid_id, industry_code, quarterly_sales,
                         quarterly_count, avg_ticket_price, snapshot_quarter)
                    VALUES (:gid, :code, :sales, :cnt, :ticket, :q)
                """), {
                    "gid": grid_row[0],
                    "code": ind_code,
                    "sales": sales,
                    "cnt": cnt,
                    "ticket": avg_ticket,
                    "q": item.get("STDR_YYQU_CD", ""),
                })
                count += 1

        if len(items) < 1000:
            break
        start += 1000

    session.commit()
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
    return len(records)
