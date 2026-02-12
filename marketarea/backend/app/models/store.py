from sqlalchemy import Column, Integer, String, Float, Date, Index
from geoalchemy2 import Geometry
from app.database import Base


class StoreMaster(Base):
    __tablename__ = "store_master"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_name = Column(String(200))
    industry_code = Column(String(10), nullable=False, index=True)
    industry_name = Column(String(100))
    address = Column(String(300))
    lat = Column(Float)
    lng = Column(Float)
    geom = Column(Geometry("POINT", srid=4326))
    grid_id = Column(Integer, index=True)
    open_date = Column(Date)
    close_date = Column(Date)
    is_active = Column(Integer, default=1)
    snapshot_date = Column(Date)

    __table_args__ = (
        Index("ix_store_master_geom", "geom", postgresql_using="gist"),
        Index("ix_store_industry_active", "industry_code", "is_active"),
    )
