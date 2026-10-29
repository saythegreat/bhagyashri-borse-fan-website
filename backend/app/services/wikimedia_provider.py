import httpx
from typing import List, Optional
from app.schemas.discovery import SearchResultItem, ProviderInfo
from app.services.base_provider import BaseDiscoveryProvider, infer_category_from_text

class WikimediaDiscoveryProvider(BaseDiscoveryProvider):
    API_URL = "https://commons.wikimedia.org/w/api.php"

    @property
    def info(self) -> ProviderInfo:
        return ProviderInfo(
            name="wikimedia",
            display_name="Wikimedia Commons",
            description="Public domain and Creative Commons repository with rich license metadata. No API key required.",
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
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": "6",  # Media/File namespace
            "gsrlimit": min(limit, 50),
            "gsroffset": offset,
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "format": "json",
        }

        headers = {
            "User-Agent": "AWorldOfBhagyashri-FanApp/1.0 (https://fan.bhagyashriborse.org; contact@fan.bhagyashriborse.org)",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(self.API_URL, params=params, headers=headers)
            if resp.status_code != 200:
                raise ValueError(f"Wikimedia API returned HTTP {resp.status_code}: {resp.text[:200]}")
            
            data = resp.json()

        results: List[SearchResultItem] = []
        pages = data.get("query", {}).get("pages", {})
        
        for page_id, page_info in pages.items():
            imageinfo_list = page_info.get("imageinfo", [])
            if not imageinfo_list:
                continue

            info = imageinfo_list[0]
            url = info.get("url")
            if not url:
                continue

            # Skip vector SVG or audio files
            mime = info.get("mime", "")
            if not mime.startswith("image/") or "svg" in mime:
                continue

            title = page_info.get("title", "").replace("File:", "").replace("_", " ")
            meta = info.get("extmetadata", {})
            
            # Extract licensing metadata
            license_short = meta.get("LicenseShortName", {}).get("value")
            license_url = meta.get("LicenseUrl", {}).get("value")
            artist = meta.get("Artist", {}).get("value", "")
            
            # Determine reuse status
            reuse_status = "permitted" if license_short and any(c in license_short.lower() for c in ["cc", "public domain", "cc0", "by-sa", "by"]) else "editorial"

            inferred_cat, conf = infer_category_from_text(f"{query} {title}")
            if category and category != "all" and inferred_cat != category:
                # Still show if user didn't specify strict filter
                pass

            # Thumbnail generation via Wikimedia thumb url
            thumb_url = info.get("thumburl") or url

            results.append(
                SearchResultItem(
                    id=f"wiki_{page_id}",
                    title=title,
                    source_name="Wikimedia Commons",
                    source_url=info.get("descriptionurl") or f"https://commons.wikimedia.org/wiki/{page_info.get('title', '')}",
                    direct_image_url=url,
                    thumbnail_url=thumb_url,
                    width=info.get("width"),
                    height=info.get("height"),
                    mime_type=mime,
                    license_name=license_short or "Creative Commons / Public Domain",
                    license_url=license_url,
                    reuse_status=reuse_status,
                    inferred_category=inferred_cat,
                    confidence=conf,
                )
            )

        return results
