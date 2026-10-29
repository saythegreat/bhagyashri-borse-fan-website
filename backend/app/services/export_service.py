import csv
import io
import json
import zipfile
from pathlib import Path
from typing import List
from sqlalchemy.orm import Session
from app.config import settings
from app.models.media import Media

def export_metadata_json(db: Session, review_status: str | None = None) -> str:
    """Export media records as a structured JSON string."""
    query = db.query(Media)
    if review_status:
        query = query.filter(Media.review_status == review_status)
    records = query.all()

    data = []
    for r in records:
        data.append({
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "source_url": r.source_url,
            "source_name": r.source_name,
            "direct_image_url": r.direct_image_url,
            "local_path": r.local_path,
            "mime_type": r.mime_type,
            "width": r.width,
            "height": r.height,
            "file_size": r.file_size,
            "sha256_hash": r.sha256_hash,
            "perceptual_hash": r.perceptual_hash,
            "category": r.category,
            "tags": r.tags,
            "license_name": r.license_name,
            "license_url": r.license_url,
            "reuse_status": r.reuse_status,
            "review_status": r.review_status,
            "is_featured": r.is_featured,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return json.dumps({
        "collection": "A World of Bhagyashri Fan Media Collection",
        "exported_count": len(data),
        "media": data
    }, indent=2)

def export_metadata_csv(db: Session, review_status: str | None = None) -> str:
    """Export media records as CSV string."""
    query = db.query(Media)
    if review_status:
        query = query.filter(Media.review_status == review_status)
    records = query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "id", "title", "category", "source_name", "source_url",
        "direct_image_url", "license_name", "reuse_status", "review_status",
        "width", "height", "file_size", "sha256_hash", "is_featured", "created_at"
    ])

    for r in records:
        writer.writerow([
            r.id,
            r.title,
            r.category,
            r.source_name,
            r.source_url,
            r.direct_image_url,
            r.license_name or "",
            r.reuse_status,
            r.review_status,
            r.width or "",
            r.height or "",
            r.file_size or "",
            r.sha256_hash or "",
            r.is_featured,
            r.created_at.isoformat() if r.created_at else "",
        ])

    return output.getvalue()

def generate_gallery_manifest(db: Session) -> dict:
    """Generate clean manifest of only approved images for the public gallery."""
    records = db.query(Media).filter(Media.review_status == "approved").order_by(Media.created_at.desc()).all()
    
    items = []
    for r in records:
        items.append({
            "id": r.id,
            "title": r.title,
            "description": r.description or "",
            "category": r.category,
            "image_url": f"/storage/{r.local_path}" if r.local_path else r.direct_image_url,
            "thumbnail_url": f"/storage/{r.thumbnail_path}" if r.thumbnail_path else (r.direct_image_url),
            "width": r.width or 1200,
            "height": r.height or 800,
            "source_name": r.source_name,
            "source_url": r.source_url,
            "license_name": r.license_name,
            "is_featured": r.is_featured,
            "tags": [t.strip() for t in r.tags.split(",") if t.strip()] if r.tags else [],
        })

    return {
        "title": "A World of Bhagyashri - Curated Public Gallery Manifest",
        "generated_at": str(Path.cwd()),
        "total_items": len(items),
        "categories": ["portraits", "traditional", "photoshoots", "lenin", "promotions", "events", "casual", "other"],
        "gallery": items,
    }

def create_media_zip(db: Session, only_approved: bool = True) -> io.BytesIO:
    """Package permitted local image files into an in-memory ZIP archive."""
    query = db.query(Media).filter(Media.local_path.isnot(None))
    if only_approved:
        query = query.filter(Media.review_status == "approved")
    records = query.all()

    storage_root = Path(settings.MEDIA_STORAGE_DIR)
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for r in records:
            if not r.local_path:
                continue
            full_path = storage_root / r.local_path
            if full_path.exists() and full_path.is_file():
                # Store in category folder within ZIP
                arcname = f"{r.category}/{full_path.name}"
                zip_file.write(full_path, arcname=arcname)
        
        # Also include JSON metadata manifest inside zip
        manifest_data = export_metadata_json(db, review_status="approved" if only_approved else None)
        zip_file.writestr("metadata.json", manifest_data)

    zip_buffer.seek(0)
    return zip_buffer
