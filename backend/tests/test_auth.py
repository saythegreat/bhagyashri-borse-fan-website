def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert "version" in data

def test_login_success(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "testadmin", "password": "TestSecret@123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["username"] == "testadmin"

def test_login_failure_wrong_password(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "testadmin", "password": "WrongPassword"},
    )
    assert response.status_code == 401
    assert "Incorrect" in response.json()["detail"]

def test_get_current_user_profile(client, admin_token_headers):
    response = client.get("/api/auth/me", headers=admin_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testadmin"
    assert data["role"] == "admin"

def test_get_current_user_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
