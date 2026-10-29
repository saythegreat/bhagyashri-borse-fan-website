import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.database import Base

class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source_url = Column(Text, nullable=False)
    source_name = Column(String(100), nullable=False)
    direct_image_url = Column(Text, nullable=False)
    local_path = Column(String(500), nullable=True)
    thumbnail_path = Column(String(500), nullable=True)
    mime_type = Column(String(50), nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    file_size = Column(Integer, nullable=True)
    sha256_hash = Column(String(64), index=True, nullable=True)
    perceptual_hash = Column(String(64), index=True, nullable=True)
    category = Column(String(50), default="other", index=True, nullable=False)
    tags = Column(String(500), default="", nullable=False)
    license_name = Column(String(100), default="Unknown / Fair Use Editorial", nullable=True)
    license_url = Column(Text, nullable=True)
    reuse_status = Column(String(50), default="editorial", nullable=False)  # permitted, restricted, editorial, unknown
    review_status = Column(String(50), default="pending", index=True, nullable=False)  # pending, approved, excluded
    is_featured = Column(Boolean, default=False, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
