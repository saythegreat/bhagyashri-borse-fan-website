from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.search import DiscoverySearch
from app.schemas.discovery import SearchRequest, SearchResponse, ProviderInfo
from app.services.image_discovery import get_registered_providers, execute_discovery_search
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/discovery", tags=["Discovery"])

@router.get("/providers", response_model=List[ProviderInfo])
def list_providers(current_user: User = Depends(get_current_user)):
    """List supported discovery providers and their configuration status."""
    return get_registered_providers()

@router.post("/search", response_model=SearchResponse)
async def perform_search(
    req: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Search external providers for candidate images of Bhagyashri Borse.
    Handles missing provider credentials gracefully with clear explanatory messages.
    """
    try:
        response = await execute_discovery_search(
            query=req.query,
            provider_name=req.provider,
            db=db,
            limit=req.limit,
            offset=req.offset,
            category=req.category,
            min_width=req.min_width,
            min_height=req.min_height,
        )
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Discovery search error: {str(e)}",
        )

@router.get("/history")
def get_search_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve history of recent discovery searches."""
    searches = db.query(DiscoverySearch).order_by(DiscoverySearch.created_at.desc()).limit(limit).all()
    return searches
