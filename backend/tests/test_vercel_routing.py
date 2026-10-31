import pytest
from starlette.testclient import TestClient
from api.index import app


@pytest.fixture
def client():
    return TestClient(app)


def test_direct_root(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["version"] == "1.0.0"


def test_direct_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data


def test_health_alias(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data


def test_api_root_alias(client):
    response = client.get("/api")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"


def test_vercel_rewrite_root_with_header(client):
    # Simulates Vercel calling /api/index.py with x-matched-path: /
    response = client.get("/api/index.py", headers={"x-matched-path": "/"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"


def test_vercel_rewrite_health_with_header(client):
    # Simulates Vercel calling /api/index.py with x-matched-path: /api/health
    response = client.get("/api/index.py", headers={"x-matched-path": "/api/health"})
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data


def test_vercel_rewrite_docs_with_header(client):
    # Simulates Vercel calling /api/index.py with x-matched-path: /docs
    response = client.get("/api/index.py", headers={"x-matched-path": "/docs"})
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")


def test_vercel_rewrite_openapi_with_header(client):
    # Simulates Vercel calling /api/index.py with x-matched-path: /openapi.json
    response = client.get("/api/index.py", headers={"x-matched-path": "/openapi.json"})
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert data["info"]["title"] == "A World of Bhagyashri - Fan API"


def test_vercel_rewrite_fallback_without_header(client):
    # When hitting /api/index.py without headers, fallback defaults to /
    response = client.get("/api/index.py")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"


def test_vercel_rewrite_prefix_path(client):
    # Path with /api/index.py/api/health
    response = client.get("/api/index.py/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
