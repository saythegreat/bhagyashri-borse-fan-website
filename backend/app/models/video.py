import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.database import Base

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    provider = Column(String(50), default="youtube", nullable=False)
    video_url = Column(Text, nullable=False)
    video_id = Column(String(100), nullable=False, index=True)
    category = Column(String(50), default="interviews", index=True, nullable=False)  # trailers, songs, interviews, promotions
    thumbnail_url = Column(Text, nullable=True)
    is_featured = Column(Boolean, default=False, index=True, nullable=False)
    local_path = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    sha256_hash = Column(String(64), nullable=True)
    review_status = Column(String(50), default="approved", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
