"""유동인구 데이터 수집 (서울 생활인구)."""
import json
from datetime import date
from pathlib import Path

import httpx
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings

SAMPLE_DIR = Path(__file__).parent / "sample_data"


def collect_floating(session: Session) -> int:
    settings = get_settings()
    if settings.should_use_sample or not settings.has_key("seoul"):
        return _load_sample(session)
    return _collect_from_api(session, settings.SEOUL_OPEN_DATA_API_KEY)


def _collect_from_api(session: Session, api_key: str) -> int:
    """서울 생활인구 API (OA-14991)에서 유동인구 수집."""
    base_url = f"http://openapi.seoul.go.kr:8088/{api_key}/json/SPOP_LOCAL_RESD_DONG"
    count = 0

    # 최근 데이터 1000건 조회
    resp = httpx.get(f"{base_url}/1/1000/", timeout=30)
    data = resp.json()
    items = data.get("SPOP_LOCAL_RESD_DONG", {}).get("row", [])

    dong_data: dict[str, dict] = {}
    for item in items:
        dong_code = item.get("ADSTRD_CODE_SE", "")
        if dong_code not in dong_data:
            dong_data[dong_code] = {
                "total": 0, "lunch": 0, "dinner": 0, "night": 0,
                "weekday": 0, "weekend": 0, "cnt": 0,
            }
        total = float(item.get("TOT_LVPOP_CO", 0))
        dong_data[dong_code]["total"] += total
        dong_data[dong_code]["cnt"] += 1

    # Grid에 행정동 기반으로 배분
    for dong_code, d in dong_data.items():
        avg_total = d["total"] / max(d["cnt"], 1)
        grids = session.execute(text(
            "SELECT id FROM grid_master WHERE dong_code = :dc"
        ), {"dc": dong_code}).fetchall()

        if not grids:
            continue

        per_grid = avg_total / len(grids)
        for (grid_id,) in grids:
            session.execute(text("""
                INSERT INTO grid_floating_stats
                    (grid_id, total_floating, lunch_ratio, dinner_ratio,
                     night_ratio, weekday_avg, weekend_avg, snapshot_date)
                VALUES (:gid, :total, 0.35, 0.30, 0.10, :wd, :we, :sd)
            """), {
                "gid": grid_id, "total": per_grid,
                "wd": per_grid * 0.7, "we": per_grid * 0.3,
                "sd": date.today(),
            })
            count += 1

    session.commit()
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
    return len(records)
