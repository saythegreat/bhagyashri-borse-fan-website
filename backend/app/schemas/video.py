import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    provider: str = "youtube"
    video_url: str
    video_id: str
    category: str = "interviews"  # trailers, songs, interviews, promotions
    thumbnail_url: Optional[str] = None
    is_featured: bool = False
    review_status: str = "approved"

class VideoCreate(BaseModel):
    title: str
    video_url: str
    category: str = "interviews"
    description: Optional[str] = None
    is_featured: bool = False

class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_featured: Optional[bool] = None
    review_status: Optional[str] = None

class VideoOut(VideoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime.datetime
