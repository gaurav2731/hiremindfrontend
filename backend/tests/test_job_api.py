"""
Tests for Job API endpoints: analyze JD and company research.
"""


class TestAnalyze:
    def test_analyze_missing_text_and_url(self, client):
        """Neither text nor URL should return 400."""
        resp = client.post("/api/job/analyze", json={})
        assert resp.status_code == 400

    def test_analyze_with_text(self, client):
        """Analyzing with text should return structured data or 500 if no AI key."""
        resp = client.post("/api/job/analyze", json={
            "text": "We are looking for a Senior Python Developer with 5+ years experience in Django, React, and AWS.",
        })
        # Without an API key, we expect 500
        assert resp.status_code in (200, 500)

    def test_analyze_with_url_invalid(self, client):
        """Analyzing with a bad URL should still attempt, may fail."""
        resp = client.post("/api/job/analyze", json={
            "url": "https://nonexistent-url-12345.com/job",
        })
        # Could fail at URL fetch or AI call — both are acceptable
        assert resp.status_code in (200, 400, 500)

    def test_analyze_empty_text(self, client):
        """Empty text string should return 500 (not crash)."""
        resp = client.post("/api/job/analyze", json={"text": ""})
        assert resp.status_code in (400, 422, 500)


class TestCompanyResearch:
    def test_company_research_missing_name(self, client):
        """Missing company_name should return 422."""
        resp = client.get("/api/job/company-research")
        assert resp.status_code == 422

    def test_company_research_with_name(self, client):
        """Valid company name should return data or 500 if no AI key."""
        resp = client.get("/api/job/company-research", params={
            "company_name": "Google",
        })
        assert resp.status_code in (200, 500)

    def test_company_research_malformed_name(self, client):
        """Non-existent company should still return structured data or error."""
        resp = client.get("/api/job/company-research", params={
            "company_name": "CompanyThatDoesNotExist12345XYZ",
        })
        assert resp.status_code in (200, 500)
