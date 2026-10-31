import os
from pathlib import Path
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, ensure_video_library_columns, get_db
from app.models.user import User
from app.core.security import hash_password
from app.api.auth import router as auth_router
from app.api.discovery import router as discovery_router
from app.api.media import router as media_router
from app.api.collector import router as collector_router
from app.api.videos import router as videos_router
from app.api.export import router as export_router

# On serverless platforms (e.g. Vercel), avoid executing global schema creation on module load.
# Schemas are pre-migrated into PostgreSQL, and cold-start execution adds latency or risk of timeout.
if not os.getenv("VERCEL"):
    try:
        Base.metadata.create_all(bind=engine)
        ensure_video_library_columns()
    except Exception as db_init_err:
        print(f"[*] Note on database table initialization: {db_init_err}")

app = FastAPI(
    title="A World of Bhagyashri - Fan API",
    description="Full-stack media discovery, collection, and gallery engine celebrating Bhagyashri Borse.",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
    redirect_slashes=False,
)

# CORS setup
raw_origins = [orig.strip() for orig in settings.FRONTEND_ORIGIN.split(",") if orig.strip()]
local_defaults = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"]
origins = list(dict.fromkeys(raw_origins + local_defaults))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Keep managed storage private; media is served through approval-checked routes.
storage_path = Path(settings.MEDIA_STORAGE_DIR)
try:
    storage_path.mkdir(parents=True, exist_ok=True)
    (storage_path / "images").mkdir(parents=True, exist_ok=True)
    (storage_path / "thumbnails").mkdir(parents=True, exist_ok=True)
except OSError:
    pass

# Include API Routers
app.include_router(auth_router)
app.include_router(discovery_router)
app.include_router(media_router)
app.include_router(collector_router)
app.include_router(videos_router)
app.include_router(export_router)

@app.get("/", tags=["Root"])
@app.get("/api", tags=["Root"], include_in_schema=False)
def root():
    """Root status endpoint for health monitoring and uptime checks."""
    return {
        "title": "A World of Bhagyashri - Fan API",
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/api/health",
        "version": "1.0.0",
    }

@app.get("/api/docs", include_in_schema=False)
def api_docs_redirect():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")

@app.get("/api/openapi.json", include_in_schema=False)
def api_openapi_redirect():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/openapi.json")

@app.on_event("startup")
def on_startup():
    """Seed initial administrator account and import initial local media if library is empty."""
    from app.database import SessionLocal
    from app.models.media import Media
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            admin_user = User(
                username=settings.ADMIN_INITIAL_USERNAME,
                password_hash=hash_password(settings.ADMIN_INITIAL_PASSWORD),
                role="admin",
            )
            db.add(admin_user)
            db.commit()
            print(f"[*] Initialized default admin user: '{settings.ADMIN_INITIAL_USERNAME}'")

        # Auto-seed local media from Photos/ if database has no media records and in development
        media_count = db.query(Media).count()
        if media_count == 0 and settings.APP_ENV != "production":
            project_root = Path(__file__).resolve().parents[2]
            photos_dir = project_root / "Photos"
            if photos_dir.exists() and photos_dir.is_dir():
                print("[*] Media library empty on startup. Auto-indexing local media collection...")
                from app.services.local_media_import import (
                    import_local_images,
                    import_local_videos,
                    exclude_stock_seed_records,
                )
                img_res = import_local_images(db, [photos_dir])
                vid_res = import_local_videos(db, [photos_dir])
                exclude_stock_seed_records(db)
                print(
                    f"[*] Auto-import completed: {img_res['imported_count']} photos, "
                    f"{vid_res['imported_count']} videos."
                )
    except Exception as e:
        print(f"[!] Warning on startup initialization: {e}")
    finally:
        db.close()

@app.get("/api/health", tags=["Health"])
@app.get("/health", tags=["Health"], include_in_schema=False)
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint for API and database connectivity."""
    db_ok = False
    try:
        from sqlalchemy import select
        db.execute(select(User.id).limit(1))
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "error",
        "app_env": settings.APP_ENV,
        "storage_ready": True,
        "version": "1.0.0",
    }
