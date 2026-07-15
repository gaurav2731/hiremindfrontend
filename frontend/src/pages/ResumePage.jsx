import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { uploadResume } from '../api/hiremind'

export default function ResumePage() {
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)
  const { resumeData, setResumeData, setResumeId } = useApp()
  const navigate = useNavigate()

  const handleFile = async (file) => {
    if (!file) return
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
      setError('Only PDF or DOCX files are accepted.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await uploadResume(file)
      setResumeData(res.data)
      setResumeId(crypto.randomUUID())
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to parse resume. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>📄 Resume Upload</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Upload your resume and let AI extract your complete professional profile.</p>
      </div>

      {!resumeData ? (
        <div className="card" style={{ maxWidth: 600 }}>
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div className="upload-icon">📄</div>
            <div className="upload-title">Drop your resume here</div>
            <div className="upload-subtitle">PDF or DOCX · Max 10MB</div>
            <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={loading}>
              {loading ? <><span className="spinner" /> Parsing...</> : '📤 Choose File'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={e => handleFile(e.target.files[0])} />
          {error && <div className="alert alert-error" style={{ marginTop: 16 }}>❌ {error}</div>}
        </div>
      ) : (
        <div className="fade-in-up">
          <div className="alert alert-success" style={{ marginBottom: 24 }}>
            ✅ Resume parsed successfully! Showing extracted profile below.
          </div>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            {/* Identity Card */}
            <div className="card">
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{resumeData.name}</h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                {resumeData.email && <span>📧 {resumeData.email} </span>}
                {resumeData.phone && <span>📱 {resumeData.phone}</span>}
              </div>
              {resumeData.summary && (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{resumeData.summary}</p>
              )}
            </div>
            {/* Skills Card */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🛠 Skills & Tech</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {resumeData.skills?.map(s => <span key={s} className="badge badge-blue">{s}</span>)}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {resumeData.technologies?.map(t => <span key={t} className="badge badge-purple">{t}</span>)}
              </div>
            </div>
          </div>

          {/* Experience */}
          {resumeData.experience?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>💼 Experience</h3>
              {resumeData.experience.map((exp, i) => (
                <div key={i} style={{ paddingBottom: 16, marginBottom: 16, borderBottom: i < resumeData.experience.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{exp.job_title}</div>
                      <div style={{ color: 'var(--accent-blue)', fontSize: 14 }}>{exp.company}</div>
                    </div>
                    {exp.start_date && <span className="badge badge-cyan">{exp.start_date} — {exp.end_date || 'Present'}</span>}
                  </div>
                  <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                    {exp.responsibilities?.map((r, j) => (
                      <li key={j} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{r}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {resumeData.projects?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🚀 Projects</h3>
              <div className="grid-2">
                {resumeData.projects.map((p, i) => (
                  <div key={i} className="card-flat">
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>{p.description}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {p.technologies?.map(t => <span key={t} className="badge badge-orange" style={{ fontSize: 11 }}>{t}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => { setResumeData(null) }}>↩ Upload New Resume</button>
            <button className="btn btn-primary" onClick={() => navigate('/job')}>
              Next: Add Job Description →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
