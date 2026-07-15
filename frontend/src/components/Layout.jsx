import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const navItems = [
  { icon: '🏠', label: 'Home', to: '/' },
  { icon: '📄', label: 'Resume', to: '/resume' },
  { icon: '💼', label: 'Job Match', to: '/job' },
  { icon: '✨', label: 'AI Tailor', to: '/tailor' },
  { icon: '🎤', label: 'Interview Prep', to: '/interview' },
  { icon: '💬', label: 'AI Coach', to: '/chat' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const { resumeData, jdData, reset } = useApp()

  const isLanding = location.pathname === '/'

  if (isLanding) {
    return (
      <>
        <nav className="navbar">
          <div className="nav-inner">
            <Link to="/" className="nav-logo">
              <div className="nav-logo-icon">🧠</div>
              <span className="nav-logo-text gradient-text">HireMind AI</span>
            </Link>
            <div className="nav-actions">
              <Link to="/resume" className="btn btn-primary btn-sm">Get Started →</Link>
            </div>
          </div>
        </nav>
        {children}
      </>
    )
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-inner">
          <Link to="/" className="nav-logo">
            <div className="nav-logo-icon">🧠</div>
            <span className="nav-logo-text gradient-text">HireMind AI</span>
          </Link>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {resumeData && (
              <span className="badge badge-green">✓ Resume Loaded</span>
            )}
            {jdData && (
              <span className="badge badge-blue">✓ JD Loaded</span>
            )}
            <button onClick={reset} className="btn btn-ghost btn-sm">Reset Session</button>
          </div>
        </div>
      </nav>
      <div className="app-layout">
        <aside className="sidebar">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-item ${location.pathname === item.to ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: 24 }}>
            {resumeData && (
              <div className="card-flat" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Candidate</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{resumeData.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{resumeData.skills?.slice(0, 3).join(', ')}</div>
              </div>
            )}
          </div>
        </aside>
        <main className="main-content">
          {children}
        </main>
      </div>
    </>
  )
}
