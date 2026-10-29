from typing import Optional, List
from pydantic import BaseModel, Field

class SearchRequest(BaseModel):
    query: str = "Bhagyashri Borse"
    provider: str = "wikimedia"  # wikimedia, openverse, bing, custom
    category: Optional[str] = "all"
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    min_width: Optional[int] = None
    min_height: Optional[int] = None

class SearchResultItem(BaseModel):
    id: str
    title: str
    source_name: str
    source_url: str
    direct_image_url: str
    thumbnail_url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    mime_type: Optional[str] = None
    license_name: Optional[str] = None
    license_url: Optional[str] = None
    reuse_status: str = "editorial"  # permitted, restricted, editorial, unknown
    inferred_category: str = "other"
    confidence: float = 0.5
    is_already_imported: bool = False
    is_duplicate: bool = False

class SearchResponse(BaseModel):
    query: str
    provider: str
    total_results: int
    results: List[SearchResultItem]
    message: Optional[str] = None

class ProviderInfo(BaseModel):
    name: str
    display_name: str
    description: str
    is_configured: bool
    requires_key: bool
    supports_free_search: bool
