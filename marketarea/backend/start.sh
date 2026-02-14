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
python -c "
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

settings = get_settings()
sync_url = settings.get_sync_db_url()
engine = create_engine(sync_url, echo=False)
Session = sessionmaker(bind=engine)

with Session() as session:
    count = session.execute(text('SELECT COUNT(*) FROM grid_master')).scalar()
    if count == 0:
        print('No grid data found. Running ETL...')
        session.close()
        engine.dispose()
        import subprocess, sys
        subprocess.run([sys.executable, 'scripts/run_etl.py'], check=True)
    else:
        print(f'Grid data exists ({count:,} rows). Skipping ETL.')
        engine.dispose()
"

echo "=== Starting uvicorn ==="
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
