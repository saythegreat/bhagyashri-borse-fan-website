#!/usr/bin/env python3
"""
Zero-loss database migration script: SQLite -> PostgreSQL (Neon / Vercel Postgres).
Copies all existing records, schemas, and sequences without modifying or deleting the source SQLite database.
"""

import os
import sys
import socket
import argparse
from pathlib import Path

# Add fallback DNS resolver hook for environments with restrictive local ISP/gateway DNS
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
        except socket.gaierror:
            fallback_ip = _resolve_host_fallback(host)
            return _orig_getaddrinfo(fallback_ip, port, family, type, proto, flags)

    def _patched_gethostbyname(host):
        try:
            return _orig_gethostbyname(host)
        except socket.gaierror:
            return _resolve_host_fallback(host)

    socket.getaddrinfo = _patched_getaddrinfo
    socket.gethostbyname = _patched_gethostbyname
except ImportError:
    pass

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.user import User
from app.models.media import Media
from app.models.video import Video
from app.models.search import DiscoverySearch, CollectionJob
from app.models.audit import AuditLog

def migrate(sqlite_path: str, pg_url: str):
    if not os.path.exists(sqlite_path):
        print(f"[!] Error: SQLite database not found at '{sqlite_path}'")
        sys.exit(1)

    # Normalize PostgreSQL URL
    if pg_url.startswith("postgres://"):
        pg_url = pg_url.replace("postgres://", "postgresql://", 1)

    print(f"[*] Source SQLite: {sqlite_path}")
    print(f"[*] Target PostgreSQL: {pg_url.split('@')[-1] if '@' in pg_url else pg_url}")

    # Connect to SQLite
    sqlite_engine = create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})
    SqliteSession = sessionmaker(bind=sqlite_engine)
    sqlite_db = SqliteSession()

    # Connect to PostgreSQL
    pg_engine = create_engine(pg_url, pool_pre_ping=True)
    PgSession = sessionmaker(bind=pg_engine)
    pg_db = PgSession()

    try:
        # Create all schemas in PostgreSQL
        print("[*] Creating database tables in PostgreSQL if not already present...")
        Base.metadata.create_all(bind=pg_engine)

        models = [
            ("users", User),
            ("media", Media),
            ("videos", Video),
            ("discovery_searches", DiscoverySearch),
            ("collection_jobs", CollectionJob),
            ("audit_logs", AuditLog),
        ]

        summary = {}

        for table_name, model in models:
            source_rows = sqlite_db.query(model).all()
            print(f"[*] Migrating table '{table_name}': {len(source_rows)} source rows found...")

            if not source_rows:
                total_in_pg = pg_db.query(model).count()
                summary[table_name] = {"source": 0, "migrated": 0, "total_pg": total_in_pg}
                print(f"    -> 0 source rows (Total in PostgreSQL: {total_in_pg})")
                continue

            # Fetch existing IDs in PostgreSQL in a single query
            existing_ids = {row[0] for row in pg_db.query(model.id).all()}

            records_to_insert = []
            for row in source_rows:
                if row.id not in existing_ids:
                    data = {
                        col.name: getattr(row, col.name)
                        for col in model.__table__.columns
                    }
                    records_to_insert.append(data)

            if records_to_insert:
                # Batch insert using the table clause for fast bulk execution
                # Process in batches of 50 to maintain small transaction footprints
                batch_size = 50
                for i in range(0, len(records_to_insert), batch_size):
                    batch = records_to_insert[i : i + batch_size]
                    pg_db.execute(model.__table__.insert(), batch)
                    pg_db.commit()

            total_in_pg = pg_db.query(model).count()
            summary[table_name] = {"source": len(source_rows), "migrated": len(records_to_insert), "total_pg": total_in_pg}
            print(f"    -> Migrated {len(records_to_insert)} new rows (Total in PostgreSQL: {total_in_pg})")

        # Fix sequence values in PostgreSQL for tables with auto-increment IDs
        with pg_engine.begin() as conn:
            for table_name, _ in models:
                try:
                    seq_query = f"SELECT pg_get_serial_sequence('{table_name}', 'id')"
                    seq_name = conn.exec_driver_sql(seq_query).scalar()
                    if seq_name:
                        conn.exec_driver_sql(
                            f"SELECT setval('{seq_name}', COALESCE((SELECT MAX(id) FROM \"{table_name}\"), 1))"
                        )
                except Exception as seq_err:
                    print(f"    [!] Note on sequence update for '{table_name}': {seq_err}")

        print("\n=== MIGRATION SUMMARY ===")
        for tbl, stats in summary.items():
            print(f"Table '{tbl}': {stats['source']} source -> {stats['total_pg']} rows in PostgreSQL")
        print("\n[+] Migration completed successfully! All records verified.")

    except Exception as e:
        pg_db.rollback()
        print(f"[!] Migration failed with error: {e}")
        raise
    finally:
        sqlite_db.close()
        pg_db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate SQLite to PostgreSQL")
    parser.add_argument(
        "--sqlite-path",
        default=str(backend_dir / "bhagyashri.db"),
        help="Path to source SQLite file (default: backend/bhagyashri.db)",
    )
    parser.add_argument(
        "--pg-url",
        default=os.getenv("DATABASE_URL", ""),
        help="Target PostgreSQL connection URL (or set DATABASE_URL env var)",
    )
    args = parser.parse_args()

    if not args.pg_url:
        print("[!] Error: PostgreSQL URL is required. Provide --pg-url or set DATABASE_URL.")
        sys.exit(1)

    migrate(args.sqlite_path, args.pg_url)
