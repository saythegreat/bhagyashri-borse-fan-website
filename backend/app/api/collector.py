from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.media import Media
from app.models.video import Video
from app.models.search import DiscoverySearch, CollectionJob
from app.models.audit import AuditLog
from app.core.dependencies import get_current_user
from app.services.duplicate_detector import find_duplicate_pairs

router = APIRouter(prefix="/api/collector", tags=["Collector Dashboard"])

@router.get("/stats")
def get_collector_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve actual database metrics for the admin collector dashboard."""
    total_media = db.query(Media).count()
    approved = db.query(Media).filter(Media.review_status == "approved").count()
    pending = db.query(Media).filter(Media.review_status == "pending").count()
    excluded = db.query(Media).filter(Media.review_status == "excluded").count()
    featured = db.query(Media).filter(Media.is_featured == True).count()
    downloaded = db.query(Media).filter(Media.local_path.isnot(None)).count()
    total_videos = db.query(Video).count()
    approved_videos = db.query(Video).filter(Video.review_status == "approved").count()
    pending_videos = db.query(Video).filter(Video.review_status == "pending").count()
    
    total_searches = db.query(DiscoverySearch).count()
    total_discovered = db.query(func.sum(DiscoverySearch.result_count)).scalar() or 0

    # Category breakdown
    cat_rows = db.query(Media.category, func.count(Media.id)).group_by(Media.category).all()
    categories_breakdown = {cat: count for cat, count in cat_rows}
    video_cat_rows = (
        db.query(Video.category, func.count(Video.id))
        .filter(Video.provider == "local")
        .group_by(Video.category)
        .all()
    )
    video_categories_breakdown = {cat: count for cat, count in video_cat_rows}

    # Duplicate count
    duplicate_pairs = find_duplicate_pairs(db, hamming_threshold=8)
    duplicates_count = len(duplicate_pairs)

    # Recent activity
    recent_activity = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()

    return {
        "total_media": total_media,
        "approved_media": approved,
        "pending_media": pending,
        "excluded_media": excluded,
        "featured_media": featured,
        "downloaded_media": downloaded,
        "total_videos": total_videos,
        "approved_videos": approved_videos,
        "pending_videos": pending_videos,
        "total_searches": total_searches,
        "total_discovered": total_discovered,
        "duplicates_count": duplicates_count,
        "categories_breakdown": categories_breakdown,
        "video_categories_breakdown": video_categories_breakdown,
        "recent_activity": [
            {
                "id": a.id,
                "action": a.action,
                "resource_type": a.resource_type,
                "details": a.details,
                "created_at": a.created_at.isoformat() if a.created_at else "",
            }
            for a in recent_activity
        ],
    }

@router.get("/jobs")
def get_collection_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List collection jobs and their statuses."""
    jobs = db.query(CollectionJob).order_by(CollectionJob.created_at.desc()).limit(20).all()
    return jobs
