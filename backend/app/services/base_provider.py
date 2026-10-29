from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.schemas.discovery import SearchResultItem, ProviderInfo

def infer_category_from_text(text: str) -> tuple[str, float]:
    """
    Infer sensible media category based on descriptive keywords.
    Returns (category, confidence).
    """
    t = text.lower()
    if any(k in t for k in ["lenin"]):
        return "lenin", 0.9
    if any(k in t for k in ["saree", "traditional", "ethnic", "lehenga", "anarkali", "diwali", "puja"]):
        return "traditional", 0.85
    if any(k in t for k in ["portrait", "close-up", "headshot", "closeup"]):
        return "portraits", 0.8
    if any(k in t for k in ["photoshoot", "magazine", "glam", "fashion", "editorial"]):
        return "photoshoots", 0.85
    if any(k in t for k in ["trailer", "poster", "promo", "promotional", "first look", "mr bachchan", "mr. bachchan", "yaariyan"]):
        return "promotions", 0.8
    if any(k in t for k in ["event", "screening", "conference", "award", "appearance", "press", "launch"]):
        return "events", 0.75
    if any(k in t for k in ["casual", "airport", "candid", "travel", "outing"]):
        return "casual", 0.7
    return "other", 0.5

class BaseDiscoveryProvider(ABC):
    @property
    @abstractmethod
    def info(self) -> ProviderInfo:
        """Return provider configuration and capability info."""
        pass

    @abstractmethod
    async def search(
        self,
        query: str,
        limit: int = 20,
        offset: int = 0,
        category: Optional[str] = None
    ) -> List[SearchResultItem]:
        """Search the external provider for media candidate items."""
        pass
