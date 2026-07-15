import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { generateQuestions } from '../api/hiremind'

const ROUND_TYPES = [
  { value: 'HR', label: 'HR Round', icon: '🤝', desc: 'Motivation, culture fit, career goals' },
  { value: 'Technical', label: 'Technical Round', icon: '⚙️', desc: 'Core tech concepts, problem-solving' },
  { value: 'Coding', label: 'Coding Round', icon: '💻', desc: 'Data structures, algorithms, coding' },
  { value: 'System Design', label: 'System Design', icon: '🏗️', desc: 'Architecture, scalability, design' },
  { value: 'Behavioral', label: 'Behavioral Round', icon: '🧠', desc: 'STAR method, past experiences' },
  { value: 'Managerial', label: 'Managerial Round', icon: '📊', desc: 'Leadership, team management' },
]

const difficultyColor = { Easy: 'badge-green', Medium: 'badge-orange', Hard: 'badge-red' }

export default function InterviewPage() {
  const { resumeData, jdData, resumeId } = useApp()
  const [selectedRound, setSelectedRound] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [expandedIdx, setExpandedIdx] = useState(null)
  const navigate = useNavigate()

  const handleGenerate = async (round) => {
    setSelectedRound(round)
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await generateQuestions(resumeId, resumeData, jdData, round.value)
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to generate questions.')
    } finally { setLoading(false) }
  }

  if (!resumeData || !jdData) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-icon">🎤</div>
        <div className="empty-title">Setup Required</div>
        <div className="empty-desc">Upload your resume and add a job description to generate personalized interview questions.</div>
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
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>🎤 Interview Prep</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Select a round to get AI-generated questions tailored to your profile and the target JD.</p>
      </div>

      {/* Round Selector */}
      <div className="features-grid" style={{ marginBottom: 28 }}>
        {ROUND_TYPES.map(round => (
          <div
            key={round.value}
            className={`card feature-card`}
            style={{
              cursor: 'pointer',
              borderColor: selectedRound?.value === round.value ? 'var(--accent-blue)' : undefined,
              background: selectedRound?.value === round.value ? 'var(--accent-blue-glow)' : undefined,
            }}
            onClick={() => handleGenerate(round)}
          >
            <div className="feature-icon blue" style={{ marginBottom: 10 }}>{round.icon}</div>
            <div className="feature-title" style={{ fontSize: 16 }}>{round.label}</div>
            <div className="feature-desc">{round.desc}</div>
            {selectedRound?.value === round.value && loading && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--accent-blue)' }}>
                <span className="spinner" /> Generating...
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>❌ {error}</div>}

      {result && (
        <div className="fade-in-up">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
              {selectedRound.icon} {result.round_type} Round — {result.questions?.length} Questions
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/chat')}>
              💬 Practice with AI Coach
            </button>
          </div>

          {/* Tips */}
          {result.preparation_tips?.length > 0 && (
            <div className="card" style={{ marginBottom: 20, background: 'rgba(59, 130, 246, 0.05)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--accent-blue)' }}>💡 Preparation Tips</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {result.preparation_tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span style={{ flexShrink: 0 }}>→</span>{tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics to Revise */}
          {result.topics_to_revise?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center' }}>📚 Revise:</span>
              {result.topics_to_revise.map(t => <span key={t} className="badge badge-purple">{t}</span>)}
            </div>
          )}

          {/* Questions */}
          {result.questions?.map((q, i) => (
            <div key={i} className="question-card">
              <div className="question-header">
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Q{i + 1}</div>
                  <div className="question-text">{q.question}</div>
                </div>
                <span className={`badge ${difficultyColor[q.difficulty] || 'badge-blue'}`} style={{ flexShrink: 0 }}>
                  {q.difficulty}
                </span>
              </div>
              <div className="question-why">🤔 {q.why_asked}</div>
              {expandedIdx === i ? (
                <>
                  <div className="question-hint">💡 <strong>Ideal answer should cover:</strong> {q.ideal_answer_hint}</div>
                  {q.follow_up && <div className="question-followup">🔁 <strong>Follow-up:</strong> {q.follow_up}</div>}
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setExpandedIdx(null)}>▲ Hide hints</button>
                </>
              ) : (
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setExpandedIdx(i)}>▼ Show answer hints</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
