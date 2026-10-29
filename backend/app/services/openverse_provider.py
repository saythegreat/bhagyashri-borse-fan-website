import httpx
from typing import List, Optional
from app.schemas.discovery import SearchResultItem, ProviderInfo
from app.services.base_provider import BaseDiscoveryProvider, infer_category_from_text

class OpenverseDiscoveryProvider(BaseDiscoveryProvider):
    API_URL = "https://api.openverse.org/v1/images/"

    @property
    def info(self) -> ProviderInfo:
        return ProviderInfo(
            name="openverse",
            display_name="Openverse",
            description="Open-access search engine for openly licensed and public domain images. No API key required.",
            is_configured=True,
            requires_key=False,
            supports_free_search=True,
        )

    async def search(
        self,
        query: str,
        limit: int = 20,
        offset: int = 0,
        category: Optional[str] = None
    ) -> List[SearchResultItem]:
        page = (offset // limit) + 1
        params = {
            "q": query,
            "page_size": min(limit, 50),
            "page": page,
        }

        headers = {
            "User-Agent": "AWorldOfBhagyashri-FanApp/1.0",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(self.API_URL, params=params, headers=headers)
            if resp.status_code != 200:
                raise ValueError(f"Openverse API returned HTTP {resp.status_code}: {resp.text[:200]}")
            
            data = resp.json()

        results: List[SearchResultItem] = []
        raw_items = data.get("results", [])

        for item in raw_items:
            img_url = item.get("url")
            if not img_url:
                continue

            title = item.get("title") or "Bhagyashri Borse Media"
            license_code = item.get("license")
            license_version = item.get("license_version", "")
            license_str = f"CC {license_code.upper()} {license_version}".strip() if license_code else "Creative Commons"
            license_url = item.get("license_url")

            inferred_cat, conf = infer_category_from_text(f"{query} {title}")

            results.append(
                SearchResultItem(
                    id=f"ov_{item.get('id')}",
                    title=title,
                    source_name=f"Openverse ({item.get('source', 'Web')})",
                    source_url=item.get("foreign_landing_url") or img_url,
                    direct_image_url=img_url,
                    thumbnail_url=item.get("thumbnail") or img_url,
                    width=item.get("width"),
                    height=item.get("height"),
                    mime_type=item.get("filetype") or "image/jpeg",
                    license_name=license_str,
                    license_url=license_url,
                    reuse_status="permitted",
                    inferred_category=inferred_cat,
                    confidence=conf,
                )
            )

        return results
