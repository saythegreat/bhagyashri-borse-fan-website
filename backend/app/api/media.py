import os
from pathlib import Path
from typing import List, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse, RedirectResponse, StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.media import Media
from app.models.video import Video
from app.models.audit import AuditLog
from app.schemas.media import (
    MediaCreate,
    MediaUpdate,
    MediaOut,
    BulkImportRequest,
    BulkActionRequest,
    DuplicatePair,
)
from app.core.dependencies import get_current_user, get_optional_user
from app.services.media_downloader import download_and_process_media
from app.services.duplicate_detector import find_duplicate_pairs
from app.services.local_media_import import (
    exclude_stock_seed_records,
    import_local_images,
    import_local_videos,
)

router = APIRouter(prefix="/api/media", tags=["Media"])

@router.post("/scan-local")
def scan_local_media(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import project-owned images and videos into the existing curator libraries."""
    project_root = Path(__file__).resolve().parents[3]
    image_result = import_local_images(
        db,
        [
            project_root / "Photos",
            project_root / "frontend" / "public" / "images",
        ],
    )
    video_result = import_local_videos(db, [project_root / "Photos"])
    excluded_placeholders = exclude_stock_seed_records(db)
    audit = AuditLog(
        user_id=current_user.id,
        action="scan_local_media",
        resource_type="media",
        details=(
            f"Imported {image_result['imported_count']} local photos and "
            f"{video_result['imported_count']} local videos; "
            f"skipped {image_result['skipped_count']} photos and "
            f"{video_result['skipped_count']} videos; "
            f"excluded {excluded_placeholders} stock placeholders."
        ),
    )
    db.add(audit)
    db.commit()
    category_counts = {
        category: count
        for category, count in db.query(Media.category, func.count(Media.id))
        .filter(Media.source_name == "Project upload")
        .group_by(Media.category)
        .all()
    }
    video_category_counts = {
        category: count
        for category, count in db.query(Video.category, func.count(Video.id))
        .filter(Video.provider == "local")
        .group_by(Video.category)
        .all()
    }
    pending_photos = (
        db.query(Media)
        .filter(
            Media.source_name == "Project upload",
            Media.review_status == "pending",
        )
        .all()
    )
    pending_videos = (
        db.query(Video)
        .filter(Video.provider == "local", Video.review_status == "pending")
        .all()
    )
    manual_review_items = [
        {
            "path": photo.tags,
            "media_type": "photo",
            "reason": "The filename and available metadata do not establish a reliable category.",
        }
        for photo in pending_photos
    ] + [
        {
            "path": video.local_path or video.title,
            "media_type": "video",
            "reason": "The filename and available metadata do not establish a reliable category.",
        }
        for video in pending_videos
    ]
    return {
        **image_result,
        "imported_video_count": video_result["imported_count"],
        "skipped_video_count": video_result["skipped_count"],
        "failed_video_items": video_result["failed_items"],
        "manual_review_count": len(manual_review_items),
        "manual_review_items": manual_review_items,
        "excluded_placeholder_count": excluded_placeholders,
        "category_counts": category_counts,
        "video_category_counts": video_category_counts,
    }

@router.get("", response_model=dict)
def get_media_list(
    category: Optional[str] = None,
    search: Optional[str] = None,
    is_featured: Optional[bool] = None,
    review_status: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Public and Admin media gallery query.
    Unauthenticated requests are strictly restricted to 'approved' media.
    """
    query = db.query(Media)

    # Security check: unauthenticated public callers only see approved items
    if not current_user:
        query = query.filter(Media.review_status == "approved")
    else:
        if review_status and review_status != "all":
            query = query.filter(Media.review_status == review_status)

    if category and category != "all":
        query = query.filter(Media.category == category.lower())

    if is_featured is not None:
        query = query.filter(Media.is_featured == is_featured)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (Media.title.ilike(search_filter)) |
            (Media.description.ilike(search_filter)) |
            (Media.tags.ilike(search_filter))
        )

    total_count = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(Media.created_at.desc()).offset(offset).limit(page_size).all()

    return {
        "items": [MediaOut.model_validate(item) for item in items],
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size if total_count > 0 else 1,
    }

@router.get("/{media_id}/image")
def get_media_image(
    media_id: int,
    thumbnail: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Serve a managed image only when it is approved or requested by an admin."""
    item = db.query(Media).filter(Media.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")
    if item.review_status != "approved" and (
        not current_user or current_user.role != "admin"
    ):
        raise HTTPException(status_code=403, detail="Access denied to unapproved media")

    def _stream_or_redirect_url(url: str, default_mime: str):
        if ".private.blob.vercel-storage.com" in url:
            token = getattr(settings, "BLOB_READ_WRITE_TOKEN", "") or os.getenv("BLOB_READ_WRITE_TOKEN", "")
            req_headers = {"Authorization": f"Bearer {token}"} if token else {}
            try:
                client = httpx.Client(timeout=30.0)
                upstream = client.stream("GET", url, headers=req_headers)
                response = upstream.__enter__()
                if response.status_code == 200:
                    media_type = response.headers.get("content-type") or default_mime
                    def content_generator():
                        try:
                            for chunk in response.iter_bytes(chunk_size=65536):
                                yield chunk
                        finally:
                            upstream.__exit__(None, None, None)
                            client.close()
                    return StreamingResponse(
                        content_generator(),
                        media_type=media_type,
                        headers={"Cache-Control": "public, max-age=86400"},
                    )
                else:
                    upstream.__exit__(None, None, None)
                    client.close()
            except Exception:
                pass
        return RedirectResponse(url=url, status_code=307)

    relative_path = item.thumbnail_path if thumbnail else item.local_path
    if relative_path and (relative_path.startswith("http://") or relative_path.startswith("https://")):
        return _stream_or_redirect_url(relative_path, "image/jpeg" if thumbnail else (item.mime_type or "image/jpeg"))

    if not relative_path:
        if item.direct_image_url and (item.direct_image_url.startswith("http://") or item.direct_image_url.startswith("https://")):
            return _stream_or_redirect_url(item.direct_image_url, item.mime_type or "image/jpeg")
        raise HTTPException(status_code=404, detail="A local image is not available")

    storage_root = Path(settings.MEDIA_STORAGE_DIR).resolve()
    image_path = (storage_root / relative_path).resolve()
    if not image_path.is_relative_to(storage_root) or not image_path.is_file():
        if item.direct_image_url and (item.direct_image_url.startswith("http://") or item.direct_image_url.startswith("https://")):
            return _stream_or_redirect_url(item.direct_image_url, item.mime_type or "image/jpeg")
        raise HTTPException(status_code=404, detail="A local image is not available")

    media_type = "image/jpeg" if thumbnail else item.mime_type
    return FileResponse(image_path, media_type=media_type or "application/octet-stream")

@router.get("/{media_id}", response_model=MediaOut)
def get_single_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Retrieve single media details."""
    item = db.query(Media).filter(Media.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")

    if item.review_status != "approved" and not current_user:
        raise HTTPException(status_code=403, detail="Access denied to unapproved media")

    return item

@router.post("/import", response_model=MediaOut, status_code=status.HTTP_201_CREATED)
async def import_media(
    payload: MediaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import an image into the collection, optionally downloading local copy."""
    local_info = {}
    if payload.download_now:
        try:
            local_info = await download_and_process_media(
                url=payload.direct_image_url,
                category=payload.category,
            )
        except Exception as e:
            # If download fails, record media item without local path or raise error
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to download image safely: {str(e)}",
            )

    media = Media(
        title=payload.title,
        description=payload.description,
        source_url=payload.source_url,
        source_name=payload.source_name,
        direct_image_url=payload.direct_image_url,
        local_path=local_info.get("local_path"),
        thumbnail_path=local_info.get("thumbnail_path"),
        mime_type=local_info.get("mime_type"),
        width=local_info.get("width"),
        height=local_info.get("height"),
        file_size=local_info.get("file_size"),
        sha256_hash=local_info.get("sha256_hash"),
        perceptual_hash=local_info.get("perceptual_hash"),
        category=payload.category,
        tags=payload.tags,
        license_name=payload.license_name,
        license_url=payload.license_url,
        reuse_status=payload.reuse_status,
        review_status="pending",
        is_featured=False,
    )

    db.add(media)
    db.commit()
    db.refresh(media)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="import_media",
        resource_type="media",
        resource_id=str(media.id),
        details=f"Imported '{media.title}' from {media.source_name}",
    )
    db.add(audit)
    db.commit()

    return media

@router.post("/bulk-import")
async def bulk_import_media(
    payload: BulkImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bulk import selected images with progress tracking and safe downloads."""
    imported_count = 0
    failed_items = []

    for item in payload.items:
        # Check if already imported
        existing = db.query(Media).filter(
            (Media.direct_image_url == item.direct_image_url) |
            (Media.source_url == item.source_url)
        ).first()

        if existing:
            continue

        local_info = {}
        if item.download:
            try:
                local_info = await download_and_process_media(
                    url=item.direct_image_url,
                    category=item.category or "other",
                )
            except Exception as e:
                failed_items.append({"title": item.title, "error": str(e)})
                continue

        media = Media(
            title=item.title,
            source_url=item.source_url,
            source_name=item.source_name,
            direct_image_url=item.direct_image_url,
            local_path=local_info.get("local_path"),
            thumbnail_path=local_info.get("thumbnail_path"),
            mime_type=local_info.get("mime_type"),
            width=local_info.get("width"),
            height=local_info.get("height"),
            file_size=local_info.get("file_size"),
            sha256_hash=local_info.get("sha256_hash"),
            perceptual_hash=local_info.get("perceptual_hash"),
            category=item.category or "other",
            tags=item.tags or "",
            license_name=item.license_name,
            license_url=item.license_url,
            reuse_status=item.reuse_status or "editorial",
            review_status="pending",
        )
        db.add(media)
        imported_count += 1

    db.commit()
    return {
        "imported_count": imported_count,
        "failed_count": len(failed_items),
        "failed_items": failed_items,
    }

@router.patch("/{media_id}", response_model=MediaOut)
def update_media(
    media_id: int,
    payload: MediaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update media metadata or review status."""
    item = db.query(Media).filter(Media.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")

    if payload.title is not None:
        item.title = payload.title
    if payload.description is not None:
        item.description = payload.description
    if payload.category is not None:
        item.category = payload.category
    if payload.tags is not None:
        item.tags = payload.tags
    if payload.review_status is not None:
        item.review_status = payload.review_status
    if payload.is_featured is not None:
        item.is_featured = payload.is_featured
    if payload.license_name is not None:
        item.license_name = payload.license_name
    if payload.reuse_status is not None:
        item.reuse_status = payload.reuse_status

    db.commit()
    db.refresh(item)
    return item

@router.post("/{media_id}/approve", response_model=MediaOut)
def approve_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve a media record for publication to the public fan gallery."""
    item = db.query(Media).filter(Media.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")

    item.review_status = "approved"
    db.commit()
    db.refresh(item)
    return item

@router.post("/{media_id}/exclude", response_model=MediaOut)
def exclude_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Exclude a media record from the public gallery."""
    item = db.query(Media).filter(Media.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")

    item.review_status = "excluded"
    db.commit()
    db.refresh(item)
    return item

@router.post("/{media_id}/feature", response_model=MediaOut)
def toggle_feature_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle is_featured status for homepage highlights."""
    item = db.query(Media).filter(Media.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")

    item.is_featured = not item.is_featured
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{media_id}")
def delete_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permanently delete a media record and clean up stored local files."""
    item = db.query(Media).filter(Media.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")

    storage_root = Path(settings.MEDIA_STORAGE_DIR)
    if item.local_path:
        full_local = storage_root / item.local_path
        if full_local.exists():
            try:
                full_local.unlink()
            except Exception:
                pass

    if item.thumbnail_path:
        full_thumb = storage_root / item.thumbnail_path
        if full_thumb.exists():
            try:
                full_thumb.unlink()
            except Exception:
                pass

    db.delete(item)
    db.commit()
    return {"message": f"Media #{media_id} successfully deleted"}

@router.post("/bulk-action")
def bulk_media_action(
    payload: BulkActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Execute batch operations across multiple media items."""
    items = db.query(Media).filter(Media.id.in_(payload.media_ids)).all()
    count = len(items)

    if payload.action == "approve":
        for item in items:
            item.review_status = "approved"
    elif payload.action == "exclude":
        for item in items:
            item.review_status = "excluded"
    elif payload.action == "feature":
        for item in items:
            item.is_featured = True
    elif payload.action == "unfeature":
        for item in items:
            item.is_featured = False
    elif payload.action == "categorize" and payload.category:
        for item in items:
            item.category = payload.category
    elif payload.action == "delete":
        storage_root = Path(settings.MEDIA_STORAGE_DIR)
        for item in items:
            if item.local_path:
                try:
                    (storage_root / item.local_path).unlink(missing_ok=True)
                except Exception:
                    pass
            if item.thumbnail_path:
                try:
                    (storage_root / item.thumbnail_path).unlink(missing_ok=True)
                except Exception:
                    pass
            db.delete(item)

    db.commit()
    return {"action": payload.action, "affected_count": count}

@router.post("/detect-duplicates", response_model=List[DuplicatePair])
def detect_duplicates(
    threshold: int = Query(default=8, ge=0, le=32),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Scan library and return all duplicate pairs with visual similarity scores."""
    pairs = find_duplicate_pairs(db, hamming_threshold=threshold)
    return pairs
