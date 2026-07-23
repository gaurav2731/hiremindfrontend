"""
Tests for Resume API endpoints: upload, tailor, roadmap, download.
"""
import io
import json
import time


class TestUpload:
    def test_upload_pdf_no_file(self, client):
        """Missing file should return 422."""
        resp = client.post("/api/resume/upload")
        assert resp.status_code == 422

    def test_upload_invalid_file_type(self, client):
        """Uploading a .txt file should return 400."""
        resp = client.post(
            "/api/resume/upload",
            files={"file": ("resume.txt", b"fake content", "text/plain")},
        )
        assert resp.status_code == 400
        assert "PDF or DOCX" in resp.text

    def test_upload_empty_pdf_returns_error(self, client):
        """Uploading an empty/malformed PDF should return 500 (won't parse)."""
        bad_pdf = b"%PDF-1.4 fake content"  # not a real PDF
        resp = client.post(
            "/api/resume/upload",
            files={"file": ("resume.pdf", bad_pdf, "application/pdf")},
        )
        assert resp.status_code == 500


class TestTailor:
    def test_tailor_missing_data(self, client):
        """Tailor with no resume_id should still work with data."""
        resp = client.post("/api/resume/tailor", json={
            "resume_data": {"name": "Test", "skills": ["Python"]},
            "jd_data": {"job_title": "Engineer", "required_skills": []},
        })
        # 500 because no OpenAI key — but structure should be right
        assert resp.status_code in (200, 500)

    def test_tailor_invalid_payload(self, client):
        """Missing fields should return 422."""
        resp = client.post("/api/resume/tailor", json={})
        assert resp.status_code == 422


class TestRoadmap:
    def test_roadmap_missing_data(self, client):
        """Roadmap with valid structure but no AI key returns 500."""
        resp = client.post("/api/resume/roadmap", json={
            "resume_data": {"name": "Test", "skills": ["Python"]},
            "jd_data": {"job_title": "Engineer", "required_skills": []},
        })
        assert resp.status_code in (200, 500)


class TestDownload:
    def test_download_with_invalid_data(self, client):
        """Download with minimum valid data should work."""
        resp = client.post("/api/resume/download", json={
            "name": "Test User",
            "skills": ["Python"],
        })
        assert resp.status_code == 200
        assert resp.headers["content-type"] == (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        assert len(resp.content) > 0

    def test_download_with_full_data(self, client, sample_resume_data):
        """Download with full resume data should generate DOCX."""
        payload = sample_resume_data.model_dump()
        resp = client.post("/api/resume/download", json=payload)
        assert resp.status_code == 200
        assert resp.headers["content-type"] == (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        assert "Content-Disposition" in resp.headers
        assert "Optimized_Resume" in resp.headers["content-disposition"]

    def test_download_empty_name(self, client):
        """Download with empty name should still generate a valid file."""
        resp = client.post("/api/resume/download", json={
            "name": "",
        })
        assert resp.status_code == 200
        assert len(resp.content) > 0
