"""인구 구조 데이터 수집 (KOSIS + 공공데이터포털)."""
import json
from datetime import date
from pathlib import Path

import httpx
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings

SAMPLE_DIR = Path(__file__).parent / "sample_data"


def collect_population(session: Session) -> int:
    settings = get_settings()
    if settings.should_use_sample or not settings.has_key("kosis"):
        return _load_sample(session)
    return _collect_from_api(session, settings.KOSIS_API_KEY)


def _collect_from_api(session: Session, api_key: str) -> int:
    """KOSIS API에서 읍면동별 인구 데이터 수집."""
    base_url = "https://kosis.kr/openapi/Param/statisticsParameterData.do"
    count = 0

    resp = httpx.get(base_url, params={
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
    }, timeout=30)

    data = resp.json()
    # 행정동별 연령대 인구 집계 → Grid 배분 로직
    # 실제로는 복잡한 파싱 필요 — 여기선 구조만 구현
    dong_pop: dict[str, dict] = {}
    for item in data if isinstance(data, list) else []:
        dong = item.get("C1_NM", "")
        age_group = item.get("C2_NM", "")
        pop = int(item.get("DT", 0))

        if dong not in dong_pop:
            dong_pop[dong] = {"total": 0, "age_20_39": 0, "age_40_59": 0, "age_60_plus": 0}
        dong_pop[dong]["total"] += pop
        # 연령대 분류는 C2 코드 기반
        if "20" <= age_group[:2] <= "39":
            dong_pop[dong]["age_20_39"] += pop
        elif "40" <= age_group[:2] <= "59":
            dong_pop[dong]["age_40_59"] += pop
        elif age_group[:2] >= "60":
            dong_pop[dong]["age_60_plus"] += pop

    for dong, d in dong_pop.items():
        total = max(d["total"], 1)
        grids = session.execute(text(
            "SELECT id FROM grid_master WHERE dong_name = :dn"
        ), {"dn": dong}).fetchall()
        if not grids:
            continue

        per_grid = total // len(grids)
        for (grid_id,) in grids:
            session.execute(text("""
                INSERT INTO grid_population_stats
                    (grid_id, total_population, age_20_39_ratio,
                     age_40_59_ratio, age_60_plus_ratio,
                     household_1_2_ratio, snapshot_date)
                VALUES (:gid, :total, :r1, :r2, :r3, 0.40, :sd)
            """), {
                "gid": grid_id, "total": per_grid,
                "r1": d["age_20_39"] / total,
                "r2": d["age_40_59"] / total,
                "r3": d["age_60_plus"] / total,
                "sd": date.today(),
            })
            count += 1

    session.commit()
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
    return len(records)
