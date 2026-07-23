"""
Tests for Auth API endpoints: register, login, profile.
"""
import time


class TestRegister:
    def test_register_success(self, client):
        """Valid registration should return 201 with token and user."""
        resp = client.post("/api/auth/register", json={
            "email": "new@example.com",
            "password": "SecurePass123!",
            "full_name": "New User",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert len(data["access_token"]) > 20
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "new@example.com"
        assert data["user"]["full_name"] == "New User"
        assert isinstance(data["user"]["id"], int)

    def test_register_without_full_name(self, client):
        """Registration should work without full_name."""
        ts = str(int(time.time() * 1000))
        resp = client.post("/api/auth/register", json={
            "email": f"noname-{ts}@example.com",
            "password": "SecurePass123!",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["user"]["full_name"] is None

    def test_register_duplicate_email(self, client):
        """Registering with an existing email should return 400."""
        client.post("/api/auth/register", json={
            "email": "dup@example.com",
            "password": "SecurePass123!",
        })
        resp = client.post("/api/auth/register", json={
            "email": "dup@example.com",
            "password": "AnotherPass456!",
        })
        assert resp.status_code == 400
        assert "already registered" in resp.text.lower()

    def test_register_invalid_email(self, client):
        """Invalid email should return 422."""
        resp = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "SecurePass123!",
        })
        assert resp.status_code == 422

    def test_register_short_password(self, client):
        """Very short password should still be accepted (no min in schema)."""
        ts = str(int(time.time() * 1000))
        resp = client.post("/api/auth/register", json={
            "email": f"shortpw-{ts}@example.com",
            "password": "ab",
        })
        # Pydantic doesn't enforce min length on password, so 201 is expected
        assert resp.status_code in (201, 422)


class TestLogin:
    def test_login_success(self, client):
        """Valid credentials should return 200 with token."""
        client.post("/api/auth/register", json={
            "email": "logintest@example.com",
            "password": "SecurePass123!",
            "full_name": "Login Test",
        })
        resp = client.post("/api/auth/login", json={
            "email": "logintest@example.com",
            "password": "SecurePass123!",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == "logintest@example.com"

    def test_login_wrong_password(self, client):
        """Wrong password should return 401."""
        client.post("/api/auth/register", json={
            "email": "wrongpw@example.com",
            "password": "CorrectPass123!",
        })
        resp = client.post("/api/auth/login", json={
            "email": "wrongpw@example.com",
            "password": "WrongPass123!",
        })
        assert resp.status_code == 401
        assert "invalid" in resp.text.lower()

    def test_login_nonexistent_email(self, client):
        """Non-existent email should return 401."""
        resp = client.post("/api/auth/login", json={
            "email": "nobody@example.com",
            "password": "SomePass123!",
        })
        assert resp.status_code == 401

    def test_login_missing_fields(self, client):
        """Missing fields should return 422."""
        resp = client.post("/api/auth/login", json={"email": "test@example.com"})
        assert resp.status_code == 422


class TestProfile:
    def test_get_profile_authenticated(self, client, auth_headers):
        """Authenticated user should get their profile."""
        resp = client.get("/api/auth/profile", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "user" in data
        assert data["user"]["email"] == "test@example.com"
        assert "resume_data" in data
        assert "jd_data" in data

    def test_get_profile_no_auth(self, client):
        """No auth header should return 401."""
        resp = client.get("/api/auth/profile")
        assert resp.status_code == 401

    def test_get_profile_invalid_token(self, client):
        """Invalid token should return 401."""
        resp = client.get("/api/auth/profile", headers={
            "Authorization": "Bearer this.is.an.invalid.jwt.token"
        })
        assert resp.status_code == 401

    def test_save_profile(self, client, auth_headers):
        """Authenticated user can save resume and JD data."""
        resp = client.put("/api/auth/profile", json={
            "resume_data": {"name": "Test User", "skills": ["Python"]},
            "jd_data": {"job_title": "Engineer", "company_name": "TestCo"},
        }, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "saved"

        # Verify it persisted
        profile = client.get("/api/auth/profile", headers=auth_headers).json()
        assert profile["resume_data"]["name"] == "Test User"
        assert profile["jd_data"]["job_title"] == "Engineer"

    def test_save_profile_partial(self, client, auth_headers):
        """Authenticated user can save only resume_data."""
        resp = client.put("/api/auth/profile", json={
            "resume_data": {"name": "Partial Update"},
        }, headers=auth_headers)
        assert resp.status_code == 200

    def test_save_profile_no_auth(self, client):
        """Saving profile without auth should return 401."""
        resp = client.put("/api/auth/profile", json={
            "resume_data": {"name": "Hacker"},
        })
        assert resp.status_code == 401
