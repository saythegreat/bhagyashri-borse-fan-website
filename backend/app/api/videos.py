from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from pathlib import Path
from app.database import get_db
from app.models.user import User
from app.models.video import Video
from app.schemas.video import VideoCreate, VideoUpdate, VideoOut
from app.services.video_service import normalize_video_entry
from app.core.dependencies import get_current_user, get_optional_user

router = APIRouter(prefix="/api/videos", tags=["Videos"])
PROJECT_ROOT = Path(__file__).resolve().parents[3]

EXCLUDED_PUBLIC_CATEGORIES = ("trailers", "songs", "interviews", "official", "dance")

@router.get("", response_model=List[VideoOut])
def list_videos(
    category: Optional[str] = None,
    is_featured: Optional[bool] = None,
    provider: Optional[str] = None,
    review_status: Optional[str] = None,
    include_all_categories: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Public video gallery listing authorized video embeds."""
    query = db.query(Video)
    is_admin = bool(current_user and current_user.role == "admin")

    if not is_admin:
        query = query.filter(
            Video.review_status == "approved",
            ~Video.category.in_(EXCLUDED_PUBLIC_CATEGORIES),
        )
    elif review_status and review_status != "all":
        query = query.filter(Video.review_status == review_status)

    if category and category != "all":
        cat_lower = category.lower()
        if not is_admin and cat_lower in EXCLUDED_PUBLIC_CATEGORIES:
            return []
        query = query.filter(Video.category == cat_lower)
    if is_featured is not None:
        query = query.filter(Video.is_featured == is_featured)
    if provider:
        query = query.filter(Video.provider == provider.lower())
    
    return query.order_by(Video.created_at.desc()).all()

@router.get("/local/{video_id}/stream")
def stream_local_video(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Stream an approved project-local video with HTTP byte-range support."""
    item = db.query(Video).filter(
        Video.provider == "local",
        Video.video_id == video_id,
    ).first()
    if not item or not item.local_path:
        raise HTTPException(status_code=404, detail="Video not found")
    if (
        item.review_status != "approved"
        and (not current_user or current_user.role != "admin")
    ):
        raise HTTPException(status_code=404, detail="Video not found")

    if item.local_path.startswith("http://") or item.local_path.startswith("https://"):
        return RedirectResponse(item.local_path, status_code=307)

    video_path = (PROJECT_ROOT / item.local_path).resolve()
    if not video_path.is_relative_to(PROJECT_ROOT) or not video_path.is_file():
        if item.video_url and (item.video_url.startswith("http://") or item.video_url.startswith("https://")):
            return RedirectResponse(item.video_url, status_code=307)
        raise HTTPException(status_code=404, detail="Video file is not available")

    return FileResponse(
        video_path,
        media_type="video/mp4",
        headers={"Cache-Control": "public, max-age=86400"},
    )

@router.post("", response_model=VideoOut, status_code=status.HTTP_201_CREATED)
def add_video(
    payload: VideoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin adds video using YouTube watch or share URL."""
    try:
        norm = normalize_video_entry(
            url=payload.video_url,
            title=payload.title,
            category=payload.category,
            description=payload.description,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Check for duplicate video ID
    existing = db.query(Video).filter(Video.video_id == norm["video_id"]).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This video is already in the gallery.")

    vid = Video(
        title=norm["title"],
        description=norm["description"],
        provider=norm["provider"],
        video_url=norm["video_url"],
        video_id=norm["video_id"],
        category=norm["category"],
        thumbnail_url=norm["thumbnail_url"],
        is_featured=payload.is_featured,
    )
    db.add(vid)
    db.commit()
    db.refresh(vid)
    return vid

@router.patch("/{video_id}", response_model=VideoOut)
def update_video(
    video_id: int,
    payload: VideoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin updates video metadata."""
    item = db.query(Video).filter(Video.id == video_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Video not found")

    if payload.title is not None:
        item.title = payload.title
    if payload.description is not None:
        item.description = payload.description
    if payload.category is not None:
        item.category = payload.category
    if payload.is_featured is not None:
        item.is_featured = payload.is_featured
    if payload.review_status is not None:
        item.review_status = payload.review_status

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{video_id}")
def delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin removes a video from the gallery."""
    item = db.query(Video).filter(Video.id == video_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Video not found")

    db.delete(item)
    db.commit()
    return {"message": f"Video #{video_id} removed"}
