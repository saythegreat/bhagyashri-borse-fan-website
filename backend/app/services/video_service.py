import re
from typing import Optional, Dict

YOUTUBE_REGEX = re.compile(
    r"(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})"
)

def extract_youtube_id(url: str) -> Optional[str]:
    """Extract YouTube video ID safely from multiple standard formats."""
    if not url:
        return None
    match = YOUTUBE_REGEX.search(url.strip())
    if match:
        return match.group(1)
    # Direct 11-char ID check
    cleaned = url.strip()
    if len(cleaned) == 11 and re.match(r"^[a-zA-Z0-9_-]{11}$", cleaned):
        return cleaned
    return None

def get_youtube_thumbnail(video_id: str) -> str:
    """Return standard YouTube high-res thumbnail URL."""
    return f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"

def normalize_video_entry(url: str, title: str, category: str = "interviews", description: Optional[str] = None) -> Dict[str, str]:
    """Validate video URL and return normalized parameters."""
    vid = extract_youtube_id(url)
    if not vid:
        raise ValueError("Invalid YouTube URL. Please provide a valid YouTube watch, share, or embed link.")
    
    return {
        "title": title.strip(),
        "description": description.strip() if description else "",
        "provider": "youtube",
        "video_url": f"https://www.youtube.com/watch?v={vid}",
        "video_id": vid,
        "category": category.lower(),
        "thumbnail_url": get_youtube_thumbnail(vid),
    }
