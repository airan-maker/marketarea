"""임대료 데이터 수집 (한국부동산원 임대동향)."""
import json
from pathlib import Path

import httpx
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings

SAMPLE_DIR = Path(__file__).parent / "sample_data"


def collect_rent(session: Session) -> int:
    settings = get_settings()
    if settings.should_use_sample or not settings.has_key("data_go_kr"):
        return _load_sample(session)
    return _collect_from_api(session, settings.DATA_GO_KR_API_KEY)


def _collect_from_api(session: Session, api_key: str) -> int:
    """한국부동산원 임대동향 API (data.go.kr/15002275)."""
    base_url = "https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent"
    count = 0

    # 서울 구별 법정동코드 앞 5자리로 조회
    gu_codes = [
        "11110", "11140", "11170", "11200", "11215", "11230", "11260",
        "11290", "11305", "11320", "11350", "11380", "11410", "11440",
        "11470", "11500", "11530", "11545", "11560", "11590", "11620",
        "11650", "11680", "11710", "11740",
    ]

    for gu_code in gu_codes:
        resp = httpx.get(base_url, params={
            "serviceKey": api_key,
            "LAWD_CD": gu_code,
            "DEAL_YMD": "202401",
            "numOfRows": 1000,
            "type": "json",
        }, timeout=30)

        data = resp.json()
        items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
        if not isinstance(items, list):
            items = [items] if items else []

        for item in items:
            rent = float(item.get("월세금액", 0)) * 10000  # 만원 → 원
            deposit = float(item.get("보증금액", 0)) * 10000
            area = float(item.get("전용면적", 1))
            rent_per_m2 = rent / area if area > 0 else 0
            deposit_per_m2 = deposit / area if area > 0 else 0

            # 가장 가까운 Grid에 매핑 (간소화)
            grid_row = session.execute(text(
                "SELECT id FROM grid_master LIMIT 1"
            )).fetchone()

            if grid_row:
                session.execute(text("""
                    INSERT INTO grid_rent_stats
                        (grid_id, rent_per_m2, deposit_per_m2,
                         rent_price_index, snapshot_quarter)
                    VALUES (:gid, :rent, :dep, 100.0, :q)
                """), {
                    "gid": grid_row[0],
                    "rent": rent_per_m2,
                    "dep": deposit_per_m2,
                    "q": "2024-Q1",
                })
                count += 1

    session.commit()
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
    return len(records)
