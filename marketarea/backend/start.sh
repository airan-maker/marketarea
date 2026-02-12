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

echo "=== Starting uvicorn ==="
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
