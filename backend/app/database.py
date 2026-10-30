import os
import socket
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# In local environments with restrictive ISP/gateway DNS, provide fallback resolution.
# Do NOT apply in serverless (e.g., Vercel / AWS Lambda) where seccomp restricts raw port 53 sockets.
if not os.getenv("VERCEL"):
    try:
        import dns.resolver
        _orig_getaddrinfo = socket.getaddrinfo
        _orig_gethostbyname = socket.gethostbyname
        _dns_cache = {}

        def _resolve_host_fallback(host):
            if host in _dns_cache:
                return _dns_cache[host]
            try:
                res = dns.resolver.Resolver(configure=False)
                res.nameservers = ["8.8.8.8", "1.1.1.1"]
                answers = res.resolve(host, "A")
                ip = answers[0].address
                _dns_cache[host] = ip
                return ip
            except Exception:
                return host

        def _patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
            try:
                return _orig_getaddrinfo(host, port, family, type, proto, flags)
            except (socket.gaierror, OSError):
                fallback_ip = _resolve_host_fallback(host)
                return _orig_getaddrinfo(fallback_ip, port, family, type, proto, flags)

        def _patched_gethostbyname(host):
            try:
                return _orig_gethostbyname(host)
            except (socket.gaierror, OSError):
                return _resolve_host_fallback(host)

        socket.getaddrinfo = _patched_getaddrinfo
        socket.gethostbyname = _patched_gethostbyname
    except ImportError:
        pass

raw_db_url = settings.DATABASE_URL
# Support Vercel Postgres / Neon URLs which often start with postgres://
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
engine_kwargs = {}

if raw_db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Serverless PostgreSQL settings: pre-ping to reconnect dropped connections,
    # and recycle connections to avoid stale socket errors in Lambda/Vercel functions.
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": 300,
    })

engine = create_engine(raw_db_url, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_video_library_columns() -> None:
    """Add local-video metadata columns to databases created before local video imports."""
    with engine.begin() as connection:
        if engine.dialect.name == "sqlite":
            columns = {
                row[1]
                for row in connection.exec_driver_sql("PRAGMA table_info(videos)").fetchall()
            }
        elif engine.dialect.name == "postgresql":
            res = connection.exec_driver_sql(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'videos'"
            ).fetchall()
            columns = {row[0] for row in res}
        else:
            return

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
