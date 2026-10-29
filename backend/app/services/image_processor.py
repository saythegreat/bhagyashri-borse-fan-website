import io
import hashlib
import os
from pathlib import Path
from typing import Tuple, Dict, Any, Optional
from PIL import Image, ImageOps
import imagehash
from app.config import settings

ALLOWED_FORMATS = {"JPEG", "JPG", "PNG", "WEBP", "AVIF"}
ALLOWED_MIME_TYPES = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
}

def compute_sha256(data: bytes) -> str:
    """Compute standard SHA-256 hash of raw bytes."""
    return hashlib.sha256(data).hexdigest()

def compute_perceptual_hash(image: Image.Image) -> str:
    """Compute 64-bit perceptual hash (pHash) string."""
    # Convert RGBA to RGB for hash consistency if needed
    if image.mode in ("RGBA", "P"):
        img_rgb = image.convert("RGB")
    else:
        img_rgb = image
    phash = imagehash.phash(img_rgb)
    return str(phash)

def process_and_save_image(
    image_bytes: bytes,
    category: str = "other",
    filename_prefix: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validate image bytes, extract dimensions, compute hashes, save full-resolution
    image to categorized storage, and generate a 500px thumbnail.
    """
    if len(image_bytes) > settings.MAX_DOWNLOAD_BYTES:
        raise ValueError(f"Image exceeds maximum size limit of {settings.MAX_DOWNLOAD_BYTES} bytes.")

    sha256_hash = compute_sha256(image_bytes)

    # Validate image using Pillow
    try:
        raw_stream = io.BytesIO(image_bytes)
        img = Image.open(raw_stream)
        img.verify()  # Verifies file integrity
    except Exception as e:
        raise ValueError(f"Corrupt or invalid image data: {str(e)}")

    # Re-open after verify() closes the stream
    stream = io.BytesIO(image_bytes)
    img = Image.open(stream)
    
    img_format = (img.format or "").upper()
    if img_format not in ALLOWED_FORMATS:
        raise ValueError(f"Unsupported image format '{img_format}'. Allowed: {ALLOWED_FORMATS}")

    exif_orientation = img.getexif().get(274, 1)
    if exif_orientation != 1:
        img = ImageOps.exif_transpose(img)

    width, height = img.size
    p_hash = compute_perceptual_hash(img)

    ext = "jpg" if img_format in ("JPEG", "JPG") else img_format.lower()
    mime_type = f"image/{ext}" if ext != "jpg" else "image/jpeg"

    # Base filename based on SHA-256 for integrity and uniqueness
    safe_name = f"{filename_prefix + '_' if filename_prefix else ''}{sha256_hash[:16]}.{ext}"

    # Target directory based on category
    cat_dir = category.lower().strip() if category else "other"
    valid_categories = [
        "portraits",
        "traditional",
        "photoshoots",
        "lenin",
        "mr-bachchan",
        "yaariyan-2",
        "chandu-champion",
        "promotions",
        "events",
        "casual",
        "other",
    ]
    if cat_dir not in valid_categories:
        cat_dir = "other"

    storage_root = Path(settings.MEDIA_STORAGE_DIR)
    images_dir = storage_root / "images" / cat_dir
    thumbnails_dir = storage_root / "thumbnails"

    images_dir.mkdir(parents=True, exist_ok=True)
    thumbnails_dir.mkdir(parents=True, exist_ok=True)

    file_path = images_dir / safe_name
    thumb_path = thumbnails_dir / f"thumb_{safe_name}"

    if exif_orientation == 1:
        with open(file_path, "wb") as f:
            f.write(image_bytes)
    else:
        save_format = "JPEG" if img_format in ("JPEG", "JPG") else img_format
        save_options = {"quality": 95} if save_format in ("JPEG", "WEBP", "AVIF") else {}
        img.save(file_path, format=save_format, **save_options)

    # Generate thumbnail
    thumb_img = img.copy()
    if thumb_img.mode in ("RGBA", "P"):
        thumb_img = thumb_img.convert("RGB")
    thumb_img.thumbnail((settings.THUMBNAIL_SIZE, settings.THUMBNAIL_SIZE), Image.Resampling.LANCZOS)
    thumb_img.save(thumb_path, format="JPEG", quality=88)

    # Return relative paths for DB storage
    rel_local_path = f"images/{cat_dir}/{safe_name}"
    rel_thumb_path = f"thumbnails/thumb_{safe_name}"

    return {
        "local_path": rel_local_path,
        "thumbnail_path": rel_thumb_path,
        "sha256_hash": sha256_hash,
        "perceptual_hash": p_hash,
        "width": width,
        "height": height,
        "file_size": len(image_bytes),
        "mime_type": mime_type,
    }
