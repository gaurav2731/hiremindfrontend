import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { tailorResume, downloadResume } from '../api/hiremind'

function ScoreRing({ value, label, color = '#3b82f6' }) {
  const r = 54; const circ = 2 * Math.PI * r
  const filled = circ * (1 - value / 100)
  const ringColor = value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="score-ring-container">
      <div className="score-ring">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={ringColor} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={filled}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="score-ring-value" style={{ color: ringColor }}>{Math.round(value)}</div>
      </div>
      <div className="score-ring-label">{label}</div>
    </div>
  )
}

export default function TailorPage() {
  const { resumeData, jdData, resumeId, tailorResult, setTailorResult } = useApp()
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleTailor = async () => {
    setLoading(true); setError(null)
    try {
      const res = await tailorResume(resumeData, jdData, resumeId)
      setTailorResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Tailoring failed. Please try again.')
    } finally { setLoading(false) }
  }

  const handleDownload = async () => {
    if (!tailorResult?.optimized_resume) return
    setDownloading(true)
    try {
      const res = await downloadResume(tailorResult.optimized_resume)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      // Get filename from Content-Disposition if present
      const contentDisposition = res.headers['content-disposition']
      let filename = 'Optimized_Resume.docx'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/)
        if (match && match[1]) filename = match[1]
      }
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (e) {
      setError('Failed to download resume.')
    } finally {
      setDownloading(false)
    }
  }

  if (!resumeData || !jdData) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-icon">⚠️</div>
        <div className="empty-title">Missing Data</div>
        <div className="empty-desc">Please upload your resume and add a job description first before tailoring.</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {!resumeData && <button className="btn btn-primary" onClick={() => navigate('/resume')}>Upload Resume</button>}
          {!jdData && <button className="btn btn-secondary" onClick={() => navigate('/job')}>Add Job Description</button>}
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>✨ AI Resume Tailor</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Let AI analyze your resume against the JD and generate specific improvements.</p>
      </div>

      {/* Context summary */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card-flat" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 28 }}>👤</span>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Candidate</div>
            <div style={{ fontWeight: 700 }}>{resumeData.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{resumeData.skills?.slice(0, 3).join(', ')}</div>
          </div>
        </div>
        <div className="card-flat" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 28 }}>💼</span>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Target Role</div>
            <div style={{ fontWeight: 700 }}>{jdData.job_title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{jdData.company_name || 'Company'}</div>
          </div>
        </div>
      </div>

      {!tailorResult ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🧠</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Ready to Optimize</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 460, margin: '0 auto 28px' }}>
            The AI will compare your resume against the JD using RAG retrieval, score it for ATS compatibility, identify gaps, and generate line-by-line improvements.
          </p>
          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>❌ {error}</div>}
          <button className="btn btn-primary btn-lg" onClick={handleTailor} disabled={loading}>
            {loading ? <><span className="spinner" /> Analyzing with AI...</> : '✨ Tailor My Resume'}
          </button>
          {loading && <p style={{ color: 'var(--text-secondary)', marginTop: 16, fontSize: 14 }}>This may take 15–30 seconds...</p>}
        </div>
      ) : (
        <div className="fade-in-up">
          {/* Score Overview */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>📊 Score Overview</h2>
            <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
              <ScoreRing value={tailorResult.ats_score} label="ATS Score" />
              <ScoreRing value={tailorResult.job_match_percent} label="Job Match" />
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--accent-green)' }}>💪 Strengths</h3>
              {tailorResult.strengths?.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 14 }}>
                  <span>✅</span><span style={{ color: 'var(--text-secondary)' }}>{s}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--accent-orange)' }}>⚠️ Gaps</h3>
              {tailorResult.weaknesses?.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 14 }}>
                  <span>🔸</span><span style={{ color: 'var(--text-secondary)' }}>{w}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Skills & Keywords */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--accent-red)' }}>❌ Missing Skills</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tailorResult.missing_skills?.map(s => <span key={s} className="badge badge-red">{s}</span>)}
              </div>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--accent-orange)' }}>🔑 Missing Keywords</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tailorResult.missing_keywords?.map(k => <span key={k} className="badge badge-orange">{k}</span>)}
              </div>
            </div>
          </div>

          {/* Line-by-line suggestions */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>✏️ Line-by-Line Improvements</h3>
            {tailorResult.suggestions?.map((s, i) => (
              <div key={i} className="suggestion-card">
                <div className="suggestion-original">
                  <div className="suggestion-label red">❌ Original</div>
                  <div className="suggestion-text">{s.original_line}</div>
                </div>
                <div className="suggestion-improved">
                  <div className="suggestion-label green">✅ Improved</div>
                  <div className="suggestion-text" style={{ color: '#34d399' }}>{s.improved_line}</div>
                </div>
                <div className="suggestion-reason">💡 {s.reason}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setTailorResult(null)}>↩ Re-analyze</button>
            {tailorResult.optimized_resume && (
              <button 
                className="btn btn-secondary" 
                onClick={handleDownload} 
                disabled={downloading}
                style={{ backgroundColor: 'var(--accent-green)', borderColor: 'var(--accent-green)', color: '#000' }}
              >
                {downloading ? <><span className="spinner" style={{ borderColor: '#000', borderTopColor: 'transparent' }}/> Downloading...</> : '📥 Download Optimized DOCX'}
              </button>
            )}
            <button className="btn btn-primary" onClick={() => navigate('/interview')}>
              🎤 Prepare for Interview →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
