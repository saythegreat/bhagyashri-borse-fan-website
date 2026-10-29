from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.media import Media
from app.models.search import DiscoverySearch
from app.schemas.discovery import SearchResultItem, ProviderInfo, SearchResponse
from app.services.base_provider import BaseDiscoveryProvider
from app.services.wikimedia_provider import WikimediaDiscoveryProvider
from app.services.openverse_provider import OpenverseDiscoveryProvider
from app.services.bing_provider import BingDiscoveryProvider

PROVIDERS: Dict[str, BaseDiscoveryProvider] = {
    "wikimedia": WikimediaDiscoveryProvider(),
    "openverse": OpenverseDiscoveryProvider(),
    "bing": BingDiscoveryProvider(),
}

def get_registered_providers() -> List[ProviderInfo]:
    """Return status and configuration info for all discovery providers."""
    return [provider.info for provider in PROVIDERS.values()]

async def execute_discovery_search(
    query: str,
    provider_name: str,
    db: Session,
    limit: int = 20,
    offset: int = 0,
    category: Optional[str] = "all",
    min_width: Optional[int] = None,
    min_height: Optional[int] = None,
) -> SearchResponse:
    """
    Execute image discovery across the selected provider, annotate with DB status
    (already imported or existing duplicate check), and log search history.
    """
    if provider_name not in PROVIDERS:
        raise ValueError(f"Unknown discovery provider '{provider_name}'. Available: {list(PROVIDERS.keys())}")

    provider = PROVIDERS[provider_name]
    raw_results = await provider.search(query=query, limit=limit, offset=offset, category=category)

    # Filter by resolution if requested
    filtered_results: List[SearchResultItem] = []
    for item in raw_results:
        if min_width and item.width and item.width < min_width:
            continue
        if min_height and item.height and item.height < min_height:
            continue
        filtered_results.append(item)

    # Check if items already exist in our Media database
    for item in filtered_results:
        existing = db.query(Media).filter(
            (Media.direct_image_url == item.direct_image_url) |
            (Media.source_url == item.source_url)
        ).first()
        if existing:
            item.is_already_imported = True

    # Record search history
    try:
        search_log = DiscoverySearch(
            query=query,
            provider=provider_name,
            result_count=len(filtered_results),
            status="completed",
        )
        db.add(search_log)
        db.commit()
    except Exception:
        db.rollback()

    return SearchResponse(
        query=query,
        provider=provider_name,
        total_results=len(filtered_results),
        results=filtered_results,
    )
