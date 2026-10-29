from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_video_library_columns() -> None:
    """Add local-video metadata columns to databases created before local video imports."""
    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as connection:
        columns = {
            row[1]
            for row in connection.exec_driver_sql("PRAGMA table_info(videos)").fetchall()
        }
        additions = {
            "local_path": "VARCHAR(500)",
            "file_size": "INTEGER",
            "sha256_hash": "VARCHAR(64)",
            "review_status": "VARCHAR(50) NOT NULL DEFAULT 'approved'",
        }
        for name, definition in additions.items():
            if name not in columns:
                connection.exec_driver_sql(
                    f"ALTER TABLE videos ADD COLUMN {name} {definition}"
                )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
