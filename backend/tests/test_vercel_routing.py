import pytest
from starlette.testclient import TestClient
from main import app
from api.index import app as api_index_app


@pytest.fixture
def client():
    return TestClient(app)


def test_native_entrypoint_consistency():
    # Verify both main.app and api.index.app point to the exact same FastAPI instance
    assert app is api_index_app


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["version"] == "1.0.0"


def test_api_root_alias(client):
    response = client.get("/api")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"


def test_health_endpoints(client):
    # Both /api/health and /health resolve cleanly
    res_api = client.get("/api/health")
    assert res_api.status_code == 200
    assert "status" in res_api.json()
    assert "database" in res_api.json()

    res_short = client.get("/health")
    assert res_short.status_code == 200
    assert "status" in res_short.json()


def test_docs_and_openapi(client):
    res_docs = client.get("/docs")
    assert res_docs.status_code == 200
    assert "text/html" in res_docs.headers.get("content-type", "")

    res_openapi = client.get("/openapi.json")
    assert res_openapi.status_code == 200
    data = res_openapi.json()
    assert "openapi" in data
    assert data["info"]["title"] == "A World of Bhagyashri - Fan API"


def test_nested_routers(client):
    # Test media router
    res_media = client.get("/api/media")
    assert res_media.status_code == 200
    assert "items" in res_media.json()

    # Test videos router
    res_videos = client.get("/api/videos")
    assert res_videos.status_code == 200
    assert isinstance(res_videos.json(), list)
