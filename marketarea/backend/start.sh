#!/bin/bash
set -e

echo "=== MarketArea Backend Starting ==="

# Create tables if they don't exist
python -c "
from sqlalchemy import create_engine, text
from app.config import get_settings
from app.database import Base
from app.models import *  # Import all models so Base.metadata knows about them

settings = get_settings()
sync_url = settings.get_sync_db_url()
print(f'Connecting to database...')

engine = create_engine(sync_url, echo=False)

# Enable PostGIS extension
with engine.connect() as conn:
    conn.execute(text('CREATE EXTENSION IF NOT EXISTS postgis'))
    conn.commit()
    print('PostGIS extension enabled')

# Create all tables
Base.metadata.create_all(bind=engine)
print('Database tables created/verified')
engine.dispose()
"

echo "=== Running ETL (if needed) ==="

# FORCE_ETL=true 이면 무조건 재실행
if [ "${FORCE_ETL}" = "true" ] || [ "${FORCE_ETL}" = "1" ]; then
    echo "FORCE_ETL is set. Running full ETL..."
    python scripts/run_etl.py --force
else
    python -c "
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

settings = get_settings()
sync_url = settings.get_sync_db_url()
engine = create_engine(sync_url, echo=False)
Session = sessionmaker(bind=engine)

with Session() as session:
    grid_count = session.execute(text('SELECT COUNT(*) FROM grid_master')).scalar()
    store_count = session.execute(text('SELECT COUNT(*) FROM grid_store_stats')).scalar()

    if grid_count == 0 or store_count == 0:
        print(f'Data missing (grids={grid_count}, store_stats={store_count}). Running ETL...')
        session.close()
        engine.dispose()
        import subprocess, sys
        subprocess.run([sys.executable, 'scripts/run_etl.py'], check=True)
    else:
        print(f'Data exists (grids={grid_count:,}, store_stats={store_count:,}). Skipping ETL.')
        engine.dispose()
"
fi

echo "=== Starting uvicorn ==="
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
