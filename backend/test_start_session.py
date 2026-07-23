import requests

payload = {
    "session_id": "test_session_123",
    "resume_id": "test_resume_123",
    "resume_data": {
        "name": "Test User"
    },
    "jd_data": {
        "job_title": "Software Engineer"
    },
    "focus": "General Career Coaching"
}

try:
    response = requests.post("http://localhost:8000/api/interview/session/start", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
