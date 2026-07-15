import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { analyzeJobDescription } from '../api/hiremind'

const priorityColor = { High: 'badge-red', Medium: 'badge-orange', Low: 'badge-green' }
const priorityEmoji = { High: '🔴', Medium: '🟡', Low: '🟢' }

export default function JobPage() {
  const [mode, setMode] = useState('text') // 'text' | 'url'
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { jdData, setJdData, resumeData } = useApp()
  const navigate = useNavigate()

  const handleAnalyze = async () => {
    if (mode === 'text' && !text.trim()) { setError('Please paste a job description.'); return }
    if (mode === 'url' && !url.trim()) { setError('Please enter a URL.'); return }
    setLoading(true); setError(null)
    try {
      const res = await analyzeJobDescription(mode === 'text' ? text : null, mode === 'url' ? url : null)
      setJdData(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to analyze job description.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>💼 Job Description Analyzer</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Paste a job description or URL. AI will rank every requirement by priority.</p>
      </div>

      {!jdData ? (
        <div className="card" style={{ maxWidth: 700 }}>
          <div className="tabs">
            <button className={`tab ${mode === 'text' ? 'active' : ''}`} onClick={() => setMode('text')}>📝 Paste Text</button>
            <button className={`tab ${mode === 'url' ? 'active' : ''}`} onClick={() => setMode('url')}>🔗 From URL</button>
          </div>
          {mode === 'text' ? (
            <div className="input-group">
              <label className="input-label">Job Description Text</label>
              <textarea
                className="textarea"
                style={{ minHeight: 240 }}
                placeholder="Paste the full job description here..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
            </div>
          ) : (
            <div className="input-group">
              <label className="input-label">Job Posting URL</label>
              <input
                className="input"
                type="url"
                placeholder="https://careers.company.com/job/..."
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>
          )}
          {error && <div className="alert alert-error" style={{ marginTop: 16 }}>❌ {error}</div>}
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={handleAnalyze} disabled={loading}>
            {loading ? <><span className="spinner" /> Analyzing...</> : '🔍 Analyze Job Description'}
          </button>
        </div>
      ) : (
        <div className="fade-in-up">
          <div className="alert alert-success" style={{ marginBottom: 24 }}>
            ✅ Job description analyzed! {jdData.job_title} at {jdData.company_name || 'Company'}
          </div>

          <div className="grid-2" style={{ marginBottom: 20 }}>
            {/* Overview */}
            <div className="card">
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{jdData.job_title}</div>
              {jdData.company_name && <div style={{ color: 'var(--accent-blue)', marginBottom: 12 }}>🏢 {jdData.company_name}</div>}
              {jdData.experience_level && (
                <span className="badge badge-purple">📈 {jdData.experience_level}</span>
              )}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>KEYWORDS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {jdData.keywords?.slice(0, 12).map(k => <span key={k} className="badge badge-cyan" style={{ fontSize: 11 }}>{k}</span>)}
                </div>
              </div>
            </div>

            {/* Tech Stack */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>⚙️ Tech Stack</h3>
              {jdData.tech_stack?.map(t => (
                <div key={t.name} className="skill-item" style={{ marginBottom: 8 }}>
                  <span className="skill-name">{t.name}</span>
                  <span className={`badge ${priorityColor[t.priority]}`}>{priorityEmoji[t.priority]} {t.priority}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Required Skills */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🎯 Required Skills (Prioritized)</h3>
            <div className="grid-2">
              {jdData.required_skills?.map(s => (
                <div key={s.name} className="skill-item">
                  <span className="skill-name">{s.name}</span>
                  <span className={`badge ${priorityColor[s.priority]}`}>{priorityEmoji[s.priority]} {s.priority}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Responsibilities */}
          {jdData.responsibilities?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>📋 Responsibilities</h3>
              <ul style={{ paddingLeft: 20 }}>
                {jdData.responsibilities.map((r, i) => (
                  <li key={i} style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setJdData(null)}>↩ New Job Description</button>
            {resumeData && (
              <button className="btn btn-primary" onClick={() => navigate('/tailor')}>
                ✨ Tailor My Resume →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
