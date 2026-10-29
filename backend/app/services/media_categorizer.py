import re
from pathlib import Path
from typing import Optional


MEDIA_CATEGORIES = (
    "beauty-queen",
    "portraits",
    "traditional",
    "photoshoots",
    "lenin",
    "mr-bachchan",
    "yaariyan-2",
    "chandu-champion",
    "events",
    "casual",
    "promotions",
    "other",
)

_CATEGORY_RULES = (
    ("beauty-queen", ("bhagyashree hero", "bhagyashri hero", "bhagyashree-hero", "bhagyashri-hero")),
    ("lenin", ("lenin",)),
    ("mr-bachchan", ("mr bachchan", "mr. bachchan", "bachchan")),
    ("yaariyan-2", ("yaariyan",)),
    ("chandu-champion", ("chandu champion",)),
    (
        "promotions",
        (
            "poster",
            "promotion",
            "promo",
            "campaign",
            "announcement",
            "teaser",
            "best debut actress",
            "welcome to the tamil cinema",
        ),
    ),
    ("events", ("event", "public appearance", "women’s day", "women's day", "award", "press meet")),
    ("traditional", ("traditional", "saree", "sari", "ethnic", "festive", "banaras", "silk")),
    (
        "photoshoots",
        (
            "photoshoot",
            "photo shoot",
            "editorial",
            "photographer",
            "stylist",
            "styling",
            "outfit",
            "jewellery",
            "jwellery",
            "shotby",
            "studio",
            "brown girl magic",
            "brown is my colour",
            "filmy max",
            "little sunshine",
            "hopeless romance",
        ),
    ),
    (
        "casual",
        (
            "casual",
            "travel",
            "mountain",
            "snowfall",
            "sunday",
            "everyday",
            "beside you",
            "maggie",
            "may so far",
            "valentines",
            "one love",
            "sensitive cuties",
            "excuse me",
            "main goal in life",
        ),
    ),
    ("portraits", ("portrait", "headshot", "selfie", "close-up", "close up", "heart on my sleeve")),
)

_VIDEO_CATEGORY_RULES = (
    ("trailers", ("trailer", "teaser")),
    ("songs", ("song", "dance", "reppal", "jil jil")),
    ("interviews", ("interview", "press", "talk", "podcast")),
    ("promotions", ("promotion", "promo", "campaign", "announcement", "best debut actress")),
    ("reels", ("whatsapp video", "reel", "short clip")),
    (
        "lifestyle",
        (
            "behind the scenes",
            "#bts",
            "sunday",
            "mountain",
            "snowfall",
            "maggie",
            "valentines",
            "one love",
            "main goal",
            "kid within",
            "caption from the comments",
            "brown is my colour",
            "princessing my way",
        ),
    ),
)


def infer_media_category(
    filename: str,
    directory: Optional[str] = None,
    caption: Optional[str] = None,
    source: Optional[str] = None,
) -> str:
    """Assign a stable category from explicit filename and source keywords."""
    searchable = " ".join(
        part for part in (str(directory or ""), Path(filename).stem, caption or "", source or "") if part
    ).casefold()
    searchable = re.sub(r"[_-]+", " ", searchable)

    for category, keywords in _CATEGORY_RULES:
        if any(keyword in searchable for keyword in keywords):
            return category
    return "other"


def infer_video_category(filename: str) -> str:
    """Assign a video category only when its filename provides reliable evidence."""
    searchable = re.sub(r"[_-]+", " ", Path(filename).stem.casefold())
    for category, keywords in _VIDEO_CATEGORY_RULES:
        if any(keyword in searchable for keyword in keywords):
            return category
    return "other"
