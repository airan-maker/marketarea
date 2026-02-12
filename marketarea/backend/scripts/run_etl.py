"""전체 ETL 파이프라인 실행 스크립트."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
from app.database import Base
from app.models import *  # noqa
from app.etl.store_collector import collect_stores
from app.etl.floating_collector import collect_floating
from app.etl.population_collector import collect_population
from app.etl.sales_collector import collect_sales
from app.etl.rent_collector import collect_rent


def main():
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL_SYNC)

    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        conn.commit()

    Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine)

    mode = "SAMPLE" if settings.should_use_sample else "API"
    print(f"Running ETL in {mode} mode...\n")

    with Session() as session:
        # 격자가 없으면 먼저 생성
        grid_count = session.execute(text("SELECT COUNT(*) FROM grid_master")).scalar()
        if grid_count == 0:
            from app.etl.grid_generator import generate_seoul_grids
            grid_count = generate_seoul_grids(session)
            print(f"[Grid] Generated {grid_count:,} grids")
        else:
            print(f"[Grid] {grid_count:,} grids already exist")

    collectors = [
        ("Store", collect_stores),
        ("Floating Population", collect_floating),
        ("Population Structure", collect_population),
        ("Sales", collect_sales),
        ("Rent", collect_rent),
    ]

    for name, collector in collectors:
        try:
            with Session() as session:
                count = collector(session)
                print(f"[{name}] Loaded {count:,} records")
        except Exception as e:
            print(f"[{name}] ERROR: {e}")

    # 점수 계산
    try:
        from app.services.score_calculator import compute_all_scores
        with Session() as session:
            score_count = compute_all_scores(session)
            print(f"\n[Score] Computed {score_count:,} grid scores")
    except Exception as e:
        print(f"[Score] ERROR: {e}")

    print("\nETL complete.")


if __name__ == "__main__":
    main()
