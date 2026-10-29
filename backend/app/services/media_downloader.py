import io
import httpx
from typing import Dict, Any, Optional
from app.config import settings
from app.services.ssrf_validator import validate_url_safe
from app.services.image_processor import process_and_save_image

async def download_and_process_media(
    url: str,
    category: str = "other",
    filename_prefix: Optional[str] = None
) -> Dict[str, Any]:
    """
    Safely download an image from a remote URL with SSRF checks, timeout limits,
    content-type validation, and size limits, then process and save it.
    """
    is_safe, reason = validate_url_safe(url)
    if not is_safe:
        raise ValueError(f"SSRF Security Violation: {reason}")

    headers = {
        "User-Agent": "AWorldOfBhagyashri-FanMediaCollector/1.0 (Educational/Fan Tribute Project; respectful collector)",
        "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    }

    transport = httpx.AsyncHTTPTransport(retries=1)
    async with httpx.AsyncClient(transport=transport, timeout=httpx.Timeout(connect=10.0, read=25.0, write=10.0, pool=10.0), follow_redirects=False) as client:
        current_url = url
        redirect_count = 0
        max_redirects = 3
        response = None

        while redirect_count <= max_redirects:
            # Validate each step of redirects to prevent SSRF via open redirectors
            is_step_safe, step_reason = validate_url_safe(current_url)
            if not is_step_safe:
                raise ValueError(f"SSRF violation on redirect: {step_reason}")

            response = await client.get(current_url, headers=headers)
            
            if response.status_code in (301, 302, 303, 307, 308):
                redirect_url = response.headers.get("location")
                if not redirect_url:
                    raise ValueError("Redirect received without Location header.")
                
                # Resolve relative redirects
                redirect_url = str(httpx.URL(current_url).join(redirect_url))
                current_url = redirect_url
                redirect_count += 1
                continue
            
            break

        if response is None or response.status_code != 200:
            status = response.status_code if response else "Unknown"
            raise ValueError(f"Failed to download image. Remote server responded with status HTTP {status}")

        # Check content-length header if provided
        cl = response.headers.get("content-length")
        if cl and int(cl) > settings.MAX_DOWNLOAD_BYTES:
            raise ValueError(f"Image declared size ({cl} bytes) exceeds limit ({settings.MAX_DOWNLOAD_BYTES} bytes).")

        content = response.content
        if len(content) > settings.MAX_DOWNLOAD_BYTES:
            raise ValueError(f"Downloaded content exceeds {settings.MAX_DOWNLOAD_BYTES} bytes.")

        if len(content) < 100:
            raise ValueError("Downloaded data is too small to be a valid image file.")

        return process_and_save_image(content, category=category, filename_prefix=filename_prefix)
