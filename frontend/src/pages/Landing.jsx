import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content fade-in-up">
          <div className="hero-badge">
            <span>⚡</span> Powered by GPT-4o + RAG + Vector Search
          </div>
          <h1 className="hero-title">
            Your AI Career Agent<br />
            <span className="gradient-text">That Actually Wins Jobs</span>
          </h1>
          <p className="hero-subtitle">
            Not just a resume scanner. HireMind AI tailors your resume for every job,
            predicts your interview questions, and coaches you to land the offer.
          </p>
          <div className="hero-actions">
            <Link to="/auth" className="btn btn-primary btn-lg">
              🚀 Start Free — Upload Resume
            </Link>
            <Link to="/auth" className="btn btn-secondary btn-lg">
              💬 Try AI Coach
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value gradient-text">3x</div>
              <div className="hero-stat-label">More Interview Calls</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value gradient-text">92%</div>
              <div className="hero-stat-label">ATS Pass Rate</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value gradient-text">10+</div>
              <div className="hero-stat-label">Interview Rounds Covered</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value gradient-text">AI</div>
              <div className="hero-stat-label">Personalized for You</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 14 }}>
              Everything You Need to <span className="gradient-text">Land the Job</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
              One platform. Every step of your job search — from resume to offer letter.
            </p>
          </div>
          <div className="features-grid">
            {features.map(f => (
              <div key={f.title} className="card feature-card fade-in-up">
                <div className={`feature-icon ${f.color}`}>{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 14 }}>
              Three Steps to <span className="gradient-text">Interview Ready</span>
            </h2>
          </div>
          <div className="grid-3">
            {steps.map((s, i) => (
              <div key={i} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Step {i + 1}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{s.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>
            Ready to <span className="gradient-text">Get Hired?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 36 }}>
            Upload your resume and let HireMind AI do the heavy lifting.
          </p>
          <Link to="/auth" className="btn btn-primary btn-lg pulse-glow">
            🧠 Start Your AI Career Prep
          </Link>
        </div>
      </section>
    </div>
  )
}

const features = [
  { icon: '📄', color: 'blue', title: 'Smart Resume Parser', desc: 'Upload PDF or DOCX. AI extracts your complete profile — skills, experience, projects, education — structured and ready for analysis.' },
  { icon: '🎯', color: 'purple', title: 'ATS Score & Tailoring', desc: 'Get your ATS compatibility score and line-by-line improvement suggestions grounded in the actual JD requirements.' },
  { icon: '🔍', color: 'cyan', title: 'JD Analyzer', desc: 'Paste any job description or URL. AI ranks every skill as High / Medium / Low priority so you know exactly what to emphasize.' },
  { icon: '🎤', color: 'green', title: 'Interview Question Generator', desc: 'Generate tailored questions for HR, Technical, System Design, Behavioral, and Managerial rounds — based on your actual experience.' },
  { icon: '💬', color: 'orange', title: 'AI Career Coach', desc: 'Chat with your personal AI coach 24/7. Get mock interview feedback, answer hints, and focus mode to stay on track.' },
  { icon: '📊', color: 'red', title: 'Skill Gap Analysis', desc: 'Instantly see which skills you are missing for your target role and get a structured learning roadmap to close the gaps.' },
]

const steps = [
  { icon: '📤', title: 'Upload Your Resume', desc: 'Drop your PDF or DOCX resume. Our AI parses every detail in seconds — no manual filling of forms.' },
  { icon: '🎯', title: 'Add Job Description', desc: 'Paste the JD text or a URL. AI analyzes requirements and ranks them by importance for your target role.' },
  { icon: '🚀', title: 'Prepare & Win', desc: 'Get your ATS score, tailored suggestions, interview questions, and AI coaching — all in one place.' },
]
