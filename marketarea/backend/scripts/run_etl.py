"""전체 ETL 파이프라인 실행 스크립트."""
import sys
import os
import time
import argparse

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
from app.database import Base
from app.models import *  # noqa
from app.etl.logger import get_etl_logger
from app.etl.store_collector import collect_stores
from app.etl.floating_collector import collect_floating
from app.etl.population_collector import collect_population
from app.etl.sales_collector import collect_sales
from app.etl.rent_collector import collect_rent

logger = get_etl_logger("run_etl")


def main():
    parser = argparse.ArgumentParser(description="Run MarketArea ETL pipeline")
    parser.add_argument("--force", action="store_true",
                        help="Force re-run: truncate stats tables before collecting")
    args = parser.parse_args()

    # FORCE_ETL 환경변수도 지원
    force = args.force or os.environ.get("FORCE_ETL", "").lower() in ("true", "1", "yes")

    settings = get_settings()
    engine = create_engine(settings.get_sync_db_url())

    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        conn.commit()

    Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine)

    mode = "SAMPLE" if settings.should_use_sample else "API"
    logger.info("Running ETL in %s mode (force=%s)", mode, force)

    total_start = time.time()

    with Session() as session:
        grid_count = session.execute(text("SELECT COUNT(*) FROM grid_master")).scalar()
        if grid_count == 0 or force:
            from app.etl.grid_generator import generate_seoul_grids
            step_start = time.time()
            grid_count = generate_seoul_grids(session)
            elapsed = time.time() - step_start
            logger.info("[Grid] Generated %s grids (%.1fs)", f"{grid_count:,}", elapsed)
        else:
            logger.info("[Grid] %s grids already exist", f"{grid_count:,}")

    if force:
        logger.info("Force mode: clearing stats tables")
        with Session() as session:
            for table in [
                "grid_score", "grid_store_stats", "grid_floating_stats",
                "grid_population_stats", "grid_sales_stats", "grid_rent_stats",
                "store_master",
            ]:
                session.execute(text(f"DELETE FROM {table}"))
            session.commit()

    collectors = [
        ("Store", collect_stores),
        ("Floating Population", collect_floating),
        ("Population Structure", collect_population),
        ("Sales", collect_sales),
        ("Rent", collect_rent),
    ]

    for name, collector in collectors:
        step_start = time.time()
        try:
            with Session() as session:
                count = collector(session)
                elapsed = time.time() - step_start
                logger.info("[%s] Loaded %s records (%.1fs)", name, f"{count:,}", elapsed)
        except Exception as e:
            elapsed = time.time() - step_start
            logger.error("[%s] ERROR after %.1fs: %s", name, elapsed, e, exc_info=True)

    # 점수 계산
    step_start = time.time()
    try:
        from app.services.score_calculator import compute_all_scores
        with Session() as session:
            score_count = compute_all_scores(session)
            elapsed = time.time() - step_start
            logger.info("[Score] Computed %s grid scores (%.1fs)", f"{score_count:,}", elapsed)
    except Exception as e:
        elapsed = time.time() - step_start
        logger.error("[Score] ERROR after %.1fs: %s", elapsed, e, exc_info=True)

    total_elapsed = time.time() - total_start
    logger.info("ETL complete in %.1fs", total_elapsed)


if __name__ == "__main__":
    main()
