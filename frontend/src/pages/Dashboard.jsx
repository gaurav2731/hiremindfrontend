import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function DashboardPage() {
  const { resumeData, jdData, tailorResult } = useApp()
  const navigate = useNavigate()

  const steps = [
    { label: 'Upload Resume', done: !!resumeData, to: '/resume', icon: '📄' },
    { label: 'Add Job Description', done: !!jdData, to: '/job', icon: '💼' },
    { label: 'Tailor Resume', done: !!tailorResult, to: '/tailor', icon: '✨' },
    { label: 'Interview Prep', done: false, to: '/interview', icon: '🎤' },
    { label: 'AI Coach Chat', done: false, to: '/chat', icon: '💬' },
  ]

  const completedSteps = steps.filter(s => s.done).length
  const progress = Math.round((completedSteps / steps.length) * 100)

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          {resumeData ? `Welcome back, ${resumeData.name?.split(' ')[0]}! 👋` : 'Welcome to HireMind AI 🧠'}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Your AI-powered career prep dashboard</p>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontWeight: 700 }}>Session Progress</span>
          <span style={{ fontSize: 22, fontWeight: 800 }} className="gradient-text">{progress}%</span>
        </div>
        <div className="progress-bar" style={{ marginBottom: 20 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {steps.map((step, i) => (
            <div
              key={step.label}
              className="card-flat"
              style={{ flex: 1, minWidth: 120, cursor: 'pointer', opacity: step.done ? 1 : 0.6, borderColor: step.done ? 'var(--accent-green)' : undefined, transition: 'all 0.2s' }}
              onClick={() => navigate(step.to)}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{step.done ? '✅' : step.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{step.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {tailorResult && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="card stat-card">
            <div className="stat-value gradient-text">{Math.round(tailorResult.ats_score)}</div>
            <div className="stat-label">ATS Score</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value gradient-text">{Math.round(tailorResult.job_match_percent)}%</div>
            <div className="stat-label">Job Match</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{tailorResult.missing_skills?.length || 0}</div>
            <div className="stat-label">Skills to Add</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{tailorResult.suggestions?.length || 0}</div>
            <div className="stat-label">Improvements</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>⚡ Quick Actions</h2>
        <div className="grid-2">
          {quickActions.map(action => (
            <div key={action.label} className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}
              onClick={() => navigate(action.to)}>
              <div className={`feature-icon ${action.color}`} style={{ flexShrink: 0 }}>{action.icon}</div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{action.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{action.desc}</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const quickActions = [
  { label: 'Upload Resume', icon: '📄', color: 'blue', to: '/resume', desc: 'Parse your PDF or DOCX with AI' },
  { label: 'Analyze Job Description', icon: '🔍', color: 'purple', to: '/job', desc: 'Rank requirements by priority' },
  { label: 'Tailor My Resume', icon: '✨', color: 'green', to: '/tailor', desc: 'Get ATS score and improvements' },
  { label: 'Interview Questions', icon: '🎤', color: 'orange', to: '/interview', desc: 'Get round-specific questions' },
]
