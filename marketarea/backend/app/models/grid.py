from sqlalchemy import Column, Integer, String, Float, Index
from geoalchemy2 import Geometry
from app.database import Base


class GridMaster(Base):
    __tablename__ = "grid_master"

    id = Column(Integer, primary_key=True, autoincrement=True)
    grid_code = Column(String(20), unique=True, nullable=False, index=True)
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    geom = Column(Geometry("POLYGON", srid=4326), nullable=False)
    dong_code = Column(String(10))
    dong_name = Column(String(50))

    __table_args__ = (
        Index("ix_grid_master_geom", "geom", postgresql_using="gist"),
    )
