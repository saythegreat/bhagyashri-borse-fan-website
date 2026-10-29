from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.export_service import (
    export_metadata_json,
    export_metadata_csv,
    generate_gallery_manifest,
    create_media_zip,
)

router = APIRouter(prefix="/api/export", tags=["Exports"])

@router.get("/json")
def get_export_json(
    review_status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export complete media metadata as JSON."""
    json_str = export_metadata_json(db, review_status=review_status)
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="bhagyashri_media_metadata.json"'},
    )

@router.get("/csv")
def get_export_csv(
    review_status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export complete media metadata as CSV."""
    csv_str = export_metadata_csv(db, review_status=review_status)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="bhagyashri_media_metadata.csv"'},
    )

@router.post("/manifest")
def get_gallery_manifest(db: Session = Depends(get_db)):
    """Generate curated public gallery manifest (only approved images)."""
    return generate_gallery_manifest(db)

@router.get("/zip")
def download_media_zip(
    only_approved: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download ZIP archive of downloaded media files and metadata manifest."""
    zip_buffer = create_media_zip(db, only_approved=only_approved)
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="bhagyashri_media_collection.zip"'},
    )
