import sys
import os

# Ensure the backend root is in sys.path for absolute imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

try:
    from app.main import app as fastapi_app
except Exception as init_err:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    fastapi_app = FastAPI(title="Startup Error Fallback")

    @fastapi_app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    def catch_all(full_path: str):
        # Do not expose exception tracebacks or internal secrets in public production responses
        is_prod = os.getenv("APP_ENV") == "production" or os.getenv("VERCEL") == "1"
        return JSONResponse(
            status_code=500,
            content={
                "detail": "FastAPI initialization failed during cold-start.",
                "error": "Internal Server Error" if is_prod else str(init_err),
            },
        )


class VercelPathNormalizer:
    """
    ASGI middleware for Vercel Serverless Functions.

    Vercel rewrites (e.g. `/(.*) -> /api/index.py`) cause ASGI `scope['path']`
    to be set to the rewritten destination (`/api/index.py` or `/api/index`).
    The actual requested path is preserved by Vercel's edge network in HTTP
    headers such as `x-matched-path`, `x-forwarded-uri`, or `x-original-uri`.

    This middleware extracts the client's actual requested path and restores
    `scope['path']` and `scope['raw_path']` so that Starlette/FastAPI route matching
    resolves `/`, `/api/health`, `/docs`, `/openapi.json`, and API routers accurately.
    """

    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    def __getattr__(self, name):
        return getattr(self.asgi_app, name)

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            raw_path = scope.get("path", "")

            # Extract lower-case request headers from ASGI scope
            headers = {}
            for k, v in scope.get("headers", []):
                headers[k.lower()] = v

            # 1. Inspect Vercel edge routing headers for original request URI
            matched_header = (
                headers.get(b"x-matched-path")
                or headers.get(b"x-forwarded-uri")
                or headers.get(b"x-original-uri")
                or headers.get(b"x-rewrite-url")
            )

            resolved_path = None
            if matched_header:
                try:
                    decoded = matched_header.decode("utf-8")
                    # Strip query parameters if present in the matched path header
                    cand_path = decoded.split("?", 1)[0]
                    if cand_path and not cand_path.startswith("/"):
                        cand_path = "/" + cand_path
                    # Avoid mapping back to the internal serverless script path
                    if cand_path not in ("/api/index.py", "/api/index", "/api/index.py/", "/api/index/"):
                        resolved_path = cand_path
                except Exception:
                    pass

            # 2. If no edge header was matched or header pointed to the script itself,
            # handle Vercel rewrite defaults:
            if not resolved_path:
                if raw_path in ("/api/index.py", "/api/index", "/api/index.py/", "/api/index/"):
                    resolved_path = "/"
                elif raw_path.startswith("/api/index.py/"):
                    resolved_path = raw_path[len("/api/index.py"):]
                elif raw_path.startswith("/api/index/"):
                    resolved_path = raw_path[len("/api/index"):]

            if resolved_path:
                scope["path"] = resolved_path
                scope["raw_path"] = resolved_path.encode("utf-8")

        await self.asgi_app(scope, receive, send)


app = VercelPathNormalizer(fastapi_app)

# Vercel looks for the ASGI / WSGI application instance (app)
__all__ = ["app"]
