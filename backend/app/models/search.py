import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class DiscoverySearch(Base):
    __tablename__ = "discovery_searches"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String(255), nullable=False)
    provider = Column(String(50), nullable=False)
    result_count = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="completed", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class CollectionJob(Base):
    __tablename__ = "collection_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_type = Column(String(50), nullable=False)  # bulk_download, duplicate_scan, reindex
    status = Column(String(50), default="running", nullable=False)  # running, completed, failed, cancelled
    progress = Column(Integer, default=0, nullable=False)  # 0 to 100 percentage
    processed_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
