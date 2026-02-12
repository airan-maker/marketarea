"""서울 100m x 100m 격자 생성기."""
import math
from sqlalchemy import text
from sqlalchemy.orm import Session


# 서울 바운딩박스 (WGS84)
SEOUL_BOUNDS = {
    "min_lng": 126.76,
    "max_lng": 127.18,
    "min_lat": 37.43,
    "max_lat": 37.70,
}

GRID_SIZE_M = 100  # 100m


def _meters_to_degrees_lat(meters: float, lat: float) -> float:
    return meters / 111_320


def _meters_to_degrees_lng(meters: float, lat: float) -> float:
    return meters / (111_320 * math.cos(math.radians(lat)))


def generate_seoul_grids(session: Session, batch_size: int = 1000) -> int:
    """서울 바운딩박스 내 100m 격자를 생성하여 grid_master에 적재한다."""
    session.execute(text("TRUNCATE grid_master RESTART IDENTITY CASCADE"))

    mid_lat = (SEOUL_BOUNDS["min_lat"] + SEOUL_BOUNDS["max_lat"]) / 2
    dlat = _meters_to_degrees_lat(GRID_SIZE_M, mid_lat)
    dlng = _meters_to_degrees_lng(GRID_SIZE_M, mid_lat)

    rows = []
    grid_idx = 0
    lat = SEOUL_BOUNDS["min_lat"]

    while lat < SEOUL_BOUNDS["max_lat"]:
        lng = SEOUL_BOUNDS["min_lng"]
        row_num = grid_idx  # track for code
        while lng < SEOUL_BOUNDS["max_lng"]:
            x1, y1 = lng, lat
            x2, y2 = lng + dlng, lat + dlat
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2

            grid_code = f"G{grid_idx:06d}"
            wkt = f"POLYGON(({x1} {y1},{x2} {y1},{x2} {y2},{x1} {y2},{x1} {y1}))"

            rows.append({
                "grid_code": grid_code,
                "center_lat": round(cy, 7),
                "center_lng": round(cx, 7),
                "wkt": wkt,
            })

            if len(rows) >= batch_size:
                _insert_batch(session, rows)
                rows.clear()

            grid_idx += 1
            lng += dlng

        lat += dlat

    if rows:
        _insert_batch(session, rows)

    session.commit()
    return grid_idx


def _insert_batch(session: Session, rows: list[dict]):
    values = ",".join(
        f"('{r['grid_code']}', {r['center_lat']}, {r['center_lng']}, "
        f"ST_GeomFromText('{r['wkt']}', 4326))"
        for r in rows
    )
    session.execute(text(
        f"INSERT INTO grid_master (grid_code, center_lat, center_lng, geom) "
        f"VALUES {values}"
    ))
