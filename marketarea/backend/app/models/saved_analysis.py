from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base


class SavedAnalysis(Base):
    __tablename__ = "saved_analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    address = Column(String(500), nullable=False)
    industry_code = Column(String(10), nullable=False)
    industry_name = Column(String(100), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    radius = Column(Integer, nullable=False)
    result_json = Column(JSONB, nullable=False)
    memo = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_saved_analyses_user_created", "user_id", created_at.desc()),
    )
