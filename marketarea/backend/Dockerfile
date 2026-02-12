FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for psycopg2, GDAL/GEOS (PostGIS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libgeos-dev \
    libproj-dev \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Make start script executable
RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"]
