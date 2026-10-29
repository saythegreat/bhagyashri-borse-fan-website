import httpx
from typing import List, Optional
from app.config import settings
from app.schemas.discovery import SearchResultItem, ProviderInfo
from app.services.base_provider import BaseDiscoveryProvider, infer_category_from_text

class BingDiscoveryProvider(BaseDiscoveryProvider):
    @property
    def info(self) -> ProviderInfo:
        is_cfg = bool(settings.BING_IMAGE_SEARCH_API_KEY and settings.BING_IMAGE_SEARCH_API_KEY.strip())
        return ProviderInfo(
            name="bing",
            display_name="Bing Image Search API (v7.0)",
            description="Comprehensive web image discovery via Microsoft Azure Cognitive Services. Requires Azure API key.",
            is_configured=is_cfg,
            requires_key=True,
            supports_free_search=False,
        )

    async def search(
        self,
        query: str,
        limit: int = 20,
        offset: int = 0,
        category: Optional[str] = None
    ) -> List[SearchResultItem]:
        if not settings.BING_IMAGE_SEARCH_API_KEY or not settings.BING_IMAGE_SEARCH_API_KEY.strip():
            raise ValueError(
                "Bing Image Search API key is not configured. "
                "Please configure BING_IMAGE_SEARCH_API_KEY in backend/.env to enable live Bing queries."
            )

        headers = {
            "Ocp-Apim-Subscription-Key": settings.BING_IMAGE_SEARCH_API_KEY.strip(),
            "User-Agent": "AWorldOfBhagyashri-FanApp/1.0",
        }

        params = {
            "q": query,
            "count": min(limit, 50),
            "offset": offset,
            "safeSearch": "Moderate",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(settings.BING_IMAGE_SEARCH_ENDPOINT, params=params, headers=headers)
            if resp.status_code == 401 or resp.status_code == 403:
                raise ValueError("Bing API authentication failed. Please check your BING_IMAGE_SEARCH_API_KEY.")
            if resp.status_code != 200:
                raise ValueError(f"Bing Image Search API error HTTP {resp.status_code}: {resp.text[:200]}")
            
            data = resp.json()

        results: List[SearchResultItem] = []
        values = data.get("value", [])

        for idx, item in enumerate(values):
            direct_url = item.get("contentUrl")
            if not direct_url:
                continue

            title = item.get("name") or f"Bhagyashri Borse - {query}"
            inferred_cat, conf = infer_category_from_text(f"{query} {title}")

            results.append(
                SearchResultItem(
                    id=f"bing_{item.get('imageId', idx)}",
                    title=title,
                    source_name=item.get("hostPageDisplayUrl", "Web Source"),
                    source_url=item.get("hostPageUrl", direct_url),
                    direct_image_url=direct_url,
                    thumbnail_url=item.get("thumbnailUrl", direct_url),
                    width=item.get("width"),
                    height=item.get("height"),
                    mime_type=f"image/{item.get('encodingFormat', 'jpeg').lower()}",
                    license_name="Web Media / Review Required",
                    license_url=None,
                    reuse_status="editorial",
                    inferred_category=inferred_cat,
                    confidence=conf,
                )
            )

        return results
