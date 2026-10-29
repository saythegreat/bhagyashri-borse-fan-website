import json
from pathlib import Path

from app.database import Base, SessionLocal, engine, ensure_video_library_columns
from app.models.media import Media
from app.models.video import Video
from app.services.local_media_import import (
    exclude_stock_seed_records,
    import_local_images,
    import_local_videos,
)


def main() -> None:
    project_root = Path(__file__).resolve().parent.parent
    Base.metadata.create_all(bind=engine)
    ensure_video_library_columns()
    db = SessionLocal()
    try:
        image_result = import_local_images(
            db,
            [
                project_root / "Photos",
                project_root / "frontend" / "public" / "images",
            ],
        )
        video_result = import_local_videos(db, [project_root / "Photos"])
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
        result = {
            **image_result,
            "imported_video_count": video_result["imported_count"],
            "skipped_video_count": video_result["skipped_count"],
            "failed_video_items": video_result["failed_items"],
            "manual_review_count": len(manual_review_items),
            "manual_review_items": manual_review_items,
        }
        result["excluded_placeholder_count"] = exclude_stock_seed_records(db)
        print(json.dumps(result, indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    main()
