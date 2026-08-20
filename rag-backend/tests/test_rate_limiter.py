import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add parent directory to python path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from rate_limiter import rate_limiter
from routers.auth import USER_DB

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Resets in-memory rate limiter state before each test."""
    rate_limiter._global_requests.clear()
    rate_limiter._auth_failed_attempts.clear()
    USER_DB["mohnishniranjhan@gmail.com"] = {
        "id": "user_test_1",
        "email": "mohnishniranjhan@gmail.com",
        "password": "mohnish@#20092006",
        "display_name": "Mohnish Niranjhan"
    }

def test_headers_on_successful_request():
    """Verify standard rate limit headers are added to all API responses."""
    response = client.get("/health")
    assert response.status_code == 200
    assert "RateLimit-Limit" in response.headers
    assert "RateLimit-Remaining" in response.headers
    assert "RateLimit-Reset" in response.headers
    assert int(response.headers["RateLimit-Limit"]) == 120

def test_login_rate_limiting_5_failed_attempts():
    """
    Test login endpoint rate limiting:
    Attempt 1 -> 401 allowed (recorded)
    Attempt 2 -> 401 allowed (recorded)
    Attempt 3 -> 401 allowed (recorded)
    Attempt 4 -> 401 allowed (recorded)
    Attempt 5 -> 401 allowed (recorded)
    Attempt 6 -> 429 Too Many Requests
    """
    client_ip = "192.168.1.100"
    headers = {"x-forwarded-for": client_ip}

    # Attempts 1 through 5 with wrong password
    for i in range(1, 6):
        resp = client.post(
            "/api/v1/auth/login/password",
            json={"identifier": "mohnishniranjhan@gmail.com", "password": f"wrong_pass_{i}"},
            headers=headers
        )
        assert resp.status_code in (401, 429), f"Attempt {i} returned {resp.status_code}"
        if i < 5:
            assert resp.status_code == 401

    # Attempt 6 must be blocked by rate limiter with 429
    resp_6 = client.post(
        "/api/v1/auth/login/password",
        json={"identifier": "mohnishniranjhan@gmail.com", "password": "wrong_pass_6"},
        headers=headers
    )
    assert resp_6.status_code == 429
    data = resp_6.json()
    assert "Too many login attempts" in data["detail"]
    assert "Retry-After" in resp_6.headers
    assert int(resp_6.headers["Retry-After"]) > 0
    assert resp_6.headers["RateLimit-Remaining"] == "0"

def test_successful_login_clears_failed_counter():
    """Verify successful login resets failed attempt count."""
    client_ip = "192.168.1.101"
    headers = {"x-forwarded-for": client_ip}

    # 3 failed attempts
    for i in range(3):
        client.post(
            "/api/v1/auth/login/password",
            json={"identifier": "mohnishniranjhan@gmail.com", "password": "wrong_password"},
            headers=headers
        )

    assert len(rate_limiter._auth_failed_attempts.get(client_ip, [])) == 3

    # Successful login
    succ_resp = client.post(
        "/api/v1/auth/login/password",
        json={"identifier": "mohnishniranjhan@gmail.com", "password": "mohnish@#20092006"},
        headers=headers
    )
    assert succ_resp.status_code == 200

    # Counter should be cleared
    assert client_ip not in rate_limiter._auth_failed_attempts

def test_global_rate_limiting():
    """Verify global limit returns 429 when max requests exceeded."""
    client_ip = "192.168.1.102"
    headers = {"x-forwarded-for": client_ip}

    # Simulate hitting global limit (120 requests)
    for _ in range(120):
        resp = client.get("/health", headers=headers)
        assert resp.status_code == 200

    # 121st request should be blocked
    resp_blocked = client.get("/health", headers=headers)
    assert resp_blocked.status_code == 429
    assert "Too many requests" in resp_blocked.json()["detail"]
    assert "Retry-After" in resp_blocked.headers
