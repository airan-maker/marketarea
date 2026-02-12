"""서울 100m x 100m 격자 초기 생성 스크립트."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
from app.database import Base
from app.models import *  # noqa: ensure all models are registered
from app.etl.grid_generator import generate_seoul_grids


def main():
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL_SYNC)

    # PostGIS 확장 활성화
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        conn.commit()

    # 테이블 생성
    Base.metadata.create_all(engine)
    print("Tables created.")

    # 격자 생성
    Session = sessionmaker(bind=engine)
    with Session() as session:
        count = generate_seoul_grids(session)
        print(f"Generated {count:,} grids for Seoul.")


if __name__ == "__main__":
    main()
