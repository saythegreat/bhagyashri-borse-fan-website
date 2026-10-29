import hashlib
from pathlib import Path
from typing import Any, Dict

from sqlalchemy.orm import Session

from app.config import settings
from app.models.media import Media
from app.models.video import Video
from app.services.media_categorizer import infer_media_category, infer_video_category
from app.services.image_processor import process_and_save_image

SUPPORTED_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".avif"}
SUPPORTED_VIDEO_SUFFIXES = {".mp4"}


def _source_files(directory: Path, suffixes: set[str]):
    return (
        path
        for path in sorted(directory.rglob("*"), key=lambda item: item.as_posix().casefold())
        if path.is_file() and path.suffix.casefold() in suffixes
    )


def _relative_project_path(source_path: Path, directory: Path) -> str:
    project_root = Path(__file__).resolve().parents[3]
    try:
        return source_path.resolve().relative_to(project_root).as_posix()
    except ValueError:
        return (Path(directory.name) / source_path.relative_to(directory)).as_posix()


def import_local_images(db: Session, directories: list[Path]) -> Dict[str, Any]:
    """Index project-owned uploads without moving or modifying source files."""
    imported = 0
    skipped = 0
    reclassified = 0
    failed = []
    manual_review_items = []

    for directory in directories:
        if not directory.exists():
            continue
        if not directory.is_dir():
            failed.append({"path": str(directory), "error": "Media source is not a directory."})
            continue

        for source_path in _source_files(directory, SUPPORTED_IMAGE_SUFFIXES):
            try:
                image_bytes = source_path.read_bytes()
                sha256_hash = hashlib.sha256(image_bytes).hexdigest()
                existing = db.query(Media).filter(Media.sha256_hash == sha256_hash).first()
                if existing:
                    inferred_category = infer_media_category(source_path.name, str(directory))
                    if existing.source_name == "Project upload" and existing.category == "other" and inferred_category != "other":
                        existing.category = inferred_category
                        db.commit()
                        reclassified += 1
                    skipped += 1
                    continue

                category = infer_media_category(source_path.name, str(directory))
                local_info = process_and_save_image(
                    image_bytes,
                    category=category,
                    filename_prefix="upload",
                )
                media = Media(
                    title=source_path.stem,
                    description=f"Uploaded project photograph: {source_path.name}",
                    source_url="",
                    source_name="Project upload",
                    direct_image_url="",
                    local_path=local_info["local_path"],
                    thumbnail_path=local_info["thumbnail_path"],
                    mime_type=local_info["mime_type"],
                    width=local_info["width"],
                    height=local_info["height"],
                    file_size=local_info["file_size"],
                    sha256_hash=local_info["sha256_hash"],
                    perceptual_hash=local_info["perceptual_hash"],
                    category=category,
                    tags=source_path.name,
                    license_name="Project upload — rights not specified",
                    reuse_status="unknown",
                    review_status="approved",  # Project-owned uploads are always trusted
                    is_featured=False,
                )
                db.add(media)
                db.commit()
                imported += 1
                if category == "other":
                    manual_review_items.append({
                        "path": str(source_path),
                        "media_type": "photo",
                        "reason": "The filename and available metadata do not establish a reliable category.",
                    })
            except (OSError, ValueError) as error:
                db.rollback()
                failed.append({"path": str(source_path), "error": str(error)})

    return {
        "imported_count": imported,
        "skipped_count": skipped,
        "reclassified_count": reclassified,
        "failed_items": failed,
        "manual_review_items": manual_review_items,
    }


def import_local_videos(db: Session, directories: list[Path]) -> Dict[str, Any]:
    """Index local videos in the existing video library without moving source files."""
    imported = 0
    skipped = 0
    failed_items = []
    manual_review_items = []
    local_records = db.query(Video).filter(Video.provider == "local").all()

    for directory in directories:
        if not directory.exists():
            continue
        if not directory.is_dir():
            failed_items.append({"path": str(directory), "error": "Media source is not a directory."})
            continue

        for source_path in _source_files(directory, SUPPORTED_VIDEO_SUFFIXES):
            try:
                file_size = source_path.stat().st_size
                digest = hashlib.sha256()
                with source_path.open("rb") as source_file:
                    for chunk in iter(lambda: source_file.read(1024 * 1024), b""):
                        digest.update(chunk)
                sha256_hash = digest.hexdigest()
                relative_path = _relative_project_path(source_path, directory)
                normalized_path = relative_path.replace("\\", "/").casefold()
                existing_by_hash = next(
                    (record for record in local_records if record.sha256_hash == sha256_hash),
                    None,
                )
                existing_by_path = next(
                    (
                        record
                        for record in local_records
                        if record.local_path
                        and record.local_path.replace("\\", "/").casefold() == normalized_path
                    ),
                    None,
                )
                if existing_by_hash:
                    if (
                        source_path.name == "WhatsApp Video 2026-10-14 at 2.10.07 PM.mp4"
                        and not existing_by_hash.thumbnail_url
                    ):
                        existing_by_hash.thumbnail_url = "/images/bhagyashree-hero.png"
                        db.commit()
                    skipped += 1
                    continue
                if existing_by_path:
                    if (
                        existing_by_path.sha256_hash is None
                        and existing_by_path.file_size == file_size
                    ):
                        skipped += 1
                    else:
                        failed_items.append({
                            "path": str(source_path),
                            "error": "A local video already uses this path with different content; review it without overwriting the existing record.",
                        })
                    continue

                video_id = hashlib.sha256(source_path.name.encode("utf-8")).hexdigest()[:16]
                existing_by_id = next(
                    (record for record in local_records if record.video_id == video_id),
                    None,
                )
                if existing_by_id:
                    video_id = hashlib.sha256(relative_path.encode("utf-8")).hexdigest()[:16]
                    if any(record.video_id == video_id for record in local_records):
                        failed_items.append({
                            "path": str(source_path),
                            "error": "A local video identifier collision requires manual review.",
                        })
                        continue

                category = infer_video_category(source_path.name)
                record = Video(
                    title=source_path.stem,
                    description="A video from the project-owned local collection.",
                    provider="local",
                    video_url=f"/media/video-{video_id}",
                    video_id=video_id,
                    category=category,
                    thumbnail_url=(
                        "/images/bhagyashree-hero.png"
                        if source_path.name == "WhatsApp Video 2026-10-14 at 2.10.07 PM.mp4"
                        else None
                    ),
                    is_featured=False,
                    local_path=relative_path,
                    file_size=file_size,
                    sha256_hash=sha256_hash,
                    review_status="approved",  # Project-owned uploads are always trusted
                )
                db.add(record)
                db.commit()
                db.refresh(record)
                local_records.append(record)
                imported += 1
                if category == "other":
                    manual_review_items.append({
                        "path": str(source_path),
                        "media_type": "video",
                        "reason": "The filename and available metadata do not establish a reliable category.",
                    })
            except (OSError, ValueError) as error:
                db.rollback()
                failed_items.append({"path": str(source_path), "error": str(error)})

    return {
        "imported_count": imported,
        "skipped_count": skipped,
        "failed_items": failed_items,
        "manual_review_items": manual_review_items,
    }


def exclude_stock_seed_records(db: Session) -> int:
    """Hide the starter records that point at unrelated Unsplash placeholders."""
    records = (
        db.query(Media)
        .filter(Media.direct_image_url.ilike("%images.unsplash.com%"))
        .filter(Media.review_status != "excluded")
        .all()
    )
    for record in records:
        record.review_status = "excluded"
        record.is_featured = False
    if records:
        db.commit()
    return len(records)
