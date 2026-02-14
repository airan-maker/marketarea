#!/bin/bash

echo "=== MarketArea Backend Starting ==="
echo "DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo 'yes' || echo 'NO!')"
echo "PORT: ${PORT:-8000}"

# Try to create tables, but don't fail if DB is unavailable
echo "=== Setting up database ==="
python -c "
from sqlalchemy import create_engine, text
from app.config import get_settings
from app.database import Base
from app.models import *

settings = get_settings()
sync_url = settings.get_sync_db_url()
print(f'Connecting to database...')

try:
    engine = create_engine(sync_url, echo=False, connect_args={'connect_timeout': 10})

    with engine.connect() as conn:
        conn.execute(text('CREATE EXTENSION IF NOT EXISTS postgis'))
        conn.commit()
        print('PostGIS extension enabled')

    Base.metadata.create_all(bind=engine)
    print('Database tables created/verified')
    engine.dispose()
except Exception as e:
    print(f'WARNING: Database setup failed: {e}')
    print('Server will start anyway. DB operations will fail until DB is available.')
" 2>&1 || echo "WARNING: DB setup script failed, continuing..."

# Check if ETL is needed (skip if DB is unavailable)
echo "=== Checking ETL status ==="
python -c "
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

try:
    settings = get_settings()
    sync_url = settings.get_sync_db_url()
    engine = create_engine(sync_url, echo=False, connect_args={'connect_timeout': 10})
    Session = sessionmaker(bind=engine)

    with Session() as session:
        grid_count = session.execute(text('SELECT COUNT(*) FROM grid_master')).scalar()
        store_count = session.execute(text('SELECT COUNT(*) FROM grid_store_stats')).scalar()

        if grid_count == 0 or store_count == 0:
            print(f'Data missing (grids={grid_count}, store_stats={store_count}).')
            print('Run ETL manually via POST /api/etl/run')
        else:
            print(f'Data exists (grids={grid_count:,}, store_stats={store_count:,}). OK.')
        engine.dispose()
except Exception as e:
    print(f'WARNING: Could not check ETL status: {e}')
" 2>&1 || echo "WARNING: ETL check failed, continuing..."

echo "=== Starting uvicorn ==="
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
