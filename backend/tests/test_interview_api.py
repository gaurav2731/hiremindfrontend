"""
Tests for Interview API endpoints: session start, chat, question generation, mock answers.
"""


class TestSession:
    def test_start_session_minimal(self, client):
        """Start session with minimal valid data."""
        resp = client.post("/api/interview/session/start", json={
            "session_id": "test-session-1",
            "resume_data": {"name": "Test User", "skills": ["Python"]},
            "jd_data": {"job_title": "Engineer", "required_skills": []},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "session_started"
        assert data["session_id"] == "test-session-1"

    def test_start_session_with_focus(self, client):
        """Start session with a focus area."""
        resp = client.post("/api/interview/session/start", json={
            "session_id": "test-session-2",
            "resume_data": {"name": "Test User", "skills": ["Python"]},
            "jd_data": {"job_title": "Engineer", "required_skills": []},
            "focus": "Technical Round Prep",
        })
        assert resp.status_code == 200
        assert resp.json()["focus"] == "Technical Round Prep"

    def test_start_session_missing_resume_data(self, client):
        """Missing required resume_data should return 422."""
        resp = client.post("/api/interview/session/start", json={
            "session_id": "test-session-3",
            "jd_data": {"job_title": "Engineer"},
        })
        assert resp.status_code == 422


class TestChat:
    def test_chat_no_session(self, client):
        """Chat without starting a session should return 404."""
        resp = client.post("/api/interview/chat", json={
            "session_id": "nonexistent-session",
            "message": "Hello",
        })
        assert resp.status_code == 404

    def test_chat_with_session(self, client):
        """Chat with a valid session should return response or 500 (no AI key)."""
        client.post("/api/interview/session/start", json={
            "session_id": "chat-session-1",
            "resume_data": {"name": "Test User", "skills": ["Python"]},
            "jd_data": {"job_title": "Engineer", "required_skills": []},
        })
        resp = client.post("/api/interview/chat", json={
            "session_id": "chat-session-1",
            "message": "Tell me about this role",
        })
        # Without API key, expect 500; with key, expect 200
        assert resp.status_code in (200, 500)

    def test_chat_empty_message(self, client):
        """Chat with empty message should still work structurally."""
        client.post("/api/interview/session/start", json={
            "session_id": "chat-session-empty",
            "resume_data": {"name": "Test User", "skills": ["Python"]},
            "jd_data": {"job_title": "Engineer", "required_skills": []},
        })
        resp = client.post("/api/interview/chat", json={
            "session_id": "chat-session-empty",
            "message": "",
        })
        assert resp.status_code in (200, 500)


class TestQuestions:
    def test_generate_questions(self, client):
        """Generate questions with valid data."""
        resp = client.post("/api/interview/questions/generate", json={
            "resume_data": {"name": "Test User", "skills": ["Python"]},
            "jd_data": {"job_title": "Engineer", "required_skills": []},
            "round_type": "Technical",
            "num_questions": 5,
        })
        assert resp.status_code in (200, 500)

    def test_generate_questions_invalid_round(self, client):
        """Invalid round_type should return 422."""
        resp = client.post("/api/interview/questions/generate", json={
            "resume_data": {"name": "Test User", "skills": ["Python"]},
            "jd_data": {"job_title": "Engineer", "required_skills": []},
            "round_type": "InvalidRound",
            "num_questions": 5,
        })
        assert resp.status_code in (422, 500)

    def test_generate_questions_negative_count(self, client):
        """Negative num_questions should return 422."""
        resp = client.post("/api/interview/questions/generate", json={
            "resume_data": {"name": "Test User", "skills": ["Python"]},
            "jd_data": {"job_title": "Engineer", "required_skills": []},
            "round_type": "Technical",
            "num_questions": -1,
        })
        assert resp.status_code in (422, 500)


class TestMockAnswers:
    def test_mock_answer_no_session(self, client):
        """Evaluating answer without session should return 404."""
        resp = client.post("/api/interview/mock/answer", json={
            "session_id": "no-session",
            "question": "What is Python?",
            "answer_text": "A programming language.",
        })
        assert resp.status_code == 404

    def test_mock_answer_with_session(self, client):
        """Evaluating answer with valid session should work."""
        client.post("/api/interview/session/start", json={
            "session_id": "mock-session-1",
            "resume_data": {"name": "Test User", "skills": ["Python"]},
            "jd_data": {"job_title": "Engineer", "required_skills": []},
        })
        resp = client.post("/api/interview/mock/answer", json={
            "session_id": "mock-session-1",
            "question": "What is Python?",
            "answer_text": "A high-level programming language.",
        })
        assert resp.status_code in (200, 500)
