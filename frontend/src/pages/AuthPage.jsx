import { useState } from 'react'
import { loginUser, registerUser } from '../api/hiremind'

export default function AuthPage({ onAuth }) {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      let res
      if (tab === 'login') {
        res = await loginUser(email, password)
      } else {
        if (!fullName.trim()) { setError('Please enter your full name.'); setLoading(false); return }
        res = await registerUser(email, password, fullName)
      }
      const { access_token, user } = res.data
      localStorage.setItem('hiremind_token', access_token)
      localStorage.setItem('hiremind_user', JSON.stringify(user))
      onAuth(access_token, user)
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: 24,
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, background: 'var(--gradient-brand)',
            borderRadius: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 26, margin: '0 auto 16px',
            boxShadow: '0 0 32px rgba(59,130,246,0.35)',
          }}>🧠</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
            <span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              HireMind AI
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {tab === 'login' ? 'Welcome back! Sign in to your account.' : 'Create your account and start your journey.'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-primary)',
            borderRadius: 12, padding: 4, marginBottom: 28, gap: 4,
          }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(null) }} style={{
                flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
                background: tab === t ? 'var(--gradient-brand)' : 'transparent',
                color: tab === t ? 'white' : 'var(--text-muted)',
              }}>
                {t === 'login' ? '🔑 Sign In' : '✨ Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {tab === 'register' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Rahul Sharma"
                  required
                  style={inputStyle}
                />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
                marginBottom: 16, padding: '10px 14px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10, color: '#f87171', fontSize: 13,
              }}>
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px 0', background: 'var(--gradient-brand)',
              border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.8 : 1, transition: 'opacity 0.2s',
            }}>
              {loading
                ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> {tab === 'login' ? 'Signing in...' : 'Creating account...'}</>
                : tab === 'login' ? '🚀 Sign In' : '✨ Create Account'
              }
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 13 }}>
          Your data is saved securely to your account 🔒
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '11px 14px', background: 'var(--bg-primary)',
  border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)',
  fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}
