import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class MediaBase(BaseModel):
    title: str
    description: Optional[str] = None
    source_url: str
    source_name: str
    direct_image_url: str
    category: str = "other"
    tags: str = ""
    license_name: Optional[str] = "Unknown / Fair Use Editorial"
    license_url: Optional[str] = None
    reuse_status: str = "editorial"

class MediaCreate(MediaBase):
    download_now: bool = True

class MediaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    review_status: Optional[str] = None  # pending, approved, excluded
    is_featured: Optional[bool] = None
    license_name: Optional[str] = None
    reuse_status: Optional[str] = None

class MediaOut(MediaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    local_path: Optional[str] = None
    thumbnail_path: Optional[str] = None
    mime_type: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None
    sha256_hash: Optional[str] = None
    perceptual_hash: Optional[str] = None
    review_status: str
    is_featured: bool
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

class BulkImportItem(BaseModel):
    title: str
    source_url: str
    source_name: str
    direct_image_url: str
    category: Optional[str] = "other"
    tags: Optional[str] = ""
    license_name: Optional[str] = "Editorial / Fan Usage"
    license_url: Optional[str] = None
    reuse_status: Optional[str] = "editorial"
    download: bool = True

class BulkImportRequest(BaseModel):
    items: List[BulkImportItem]

class BulkActionRequest(BaseModel):
    media_ids: List[int]
    action: str  # approve, exclude, delete, feature, unfeature, categorize
    category: Optional[str] = None
    tags: Optional[str] = None

class DuplicatePair(BaseModel):
    media_a: MediaOut
    media_b: MediaOut
    similarity_type: str  # exact_sha256 or visual_phash
    hamming_distance: Optional[int] = None
    similarity_score: float  # 0.0 to 1.0 (1.0 = identical)
