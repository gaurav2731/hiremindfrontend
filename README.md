# HireMind AI

AI Career Agent for Resume Optimization, Hiring Intelligence, and Interview
Success. See `HireMind_AI_PRD.md` and `HireMind_AI_TechStack.md` for full
product and architecture details.

This repo currently contains the **Phase 1 + Phase 2** skeleton: project
structure, backend API skeleton (auth, resume, job, interview routes —
placeholder logic), and a minimal frontend that confirms the frontend can
reach the backend.

## Local Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # then fill in ANTHROPIC_API_KEY etc.
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` to confirm the Swagger UI loads and
`/health` returns `{"status": "ok"}`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` — the dashboard should show
`Backend status: ok` if the backend is running.

### Run tests

```bash
cd backend
pytest
```

### Run with Docker Compose (both services)

```bash
docker compose up --build
```

## What's implemented vs. placeholder

| Module | Status |
|---|---|
| Project structure | ✅ Done |
| Auth (register/login, JWT) | ✅ Done |
| CORS, health check, `.env` config | ✅ Done |
| Resume upload endpoint | ✅ Accepts file; parsing logic is Phase 3 |
| JD analyze endpoint | ✅ Accepts input; parsing logic is Phase 4 |
| Focus mode / mock interview endpoints | ⏳ Skeleton only — Phase 6/8 |
| RAG / vector DB | ⏳ Not started — Phase 5 |
| Resume customization, roadmap, company intelligence | ⏳ Not started |

## Next steps (Phase 3 onward)

1. Implement resume text extraction (PyMuPDF/python-docx) in
   `app/services/resume_parser.py`
2. Implement JD analysis in `app/services/jd_analyzer.py`
3. Set up ChromaDB/FAISS + embeddings for RAG (Phase 5)
4. Build out Focus Mode session state and Mock Interview evaluation logic
   (Phase 6, 8)
5. Replace `Base.metadata.create_all()` in `main.py` with Alembic
   migrations before touching a production database
