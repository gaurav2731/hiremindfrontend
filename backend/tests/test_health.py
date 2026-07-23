"""
Tests for health check and root endpoints.
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestHealthCheck:
    def test_health_check(self):
        """Basic liveness check should return ok."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_health_check_method_not_allowed(self):
        """POST to health should return 405."""
        response = client.post("/health")
        assert response.status_code == 405

    def test_root_endpoint(self):
        """Root endpoint should return app info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "app" in data
        assert "status" in data
        assert data["status"] == "running"
        assert "HireMind AI" in data["app"]

    def test_root_method_not_allowed(self):
        """POST to root should return 405."""
        response = client.post("/")
        assert response.status_code == 405
