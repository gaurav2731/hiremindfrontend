import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  uploadResume, analyzeJobDescription, tailorResume, downloadResume,
  generateQuestions, startSession, sendChat, checkHealth
} from '../api/hiremind'

// ─── Simple Markdown Renderer ────────────────────────────────────────────
function parseMarkdown(text) {
  const lines = text.split('\n')
  const elements = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // Skip empty lines but add spacing
    if (line.trim() === '') {
      elements.push(<div key={key++} style={{ height: 8 }} />)
      continue
    }

    // Inline formatting helper
    const formatInline = (str) => {
      const parts = []
      const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g
      let lastIndex = 0, match
      let idx = 0
      while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIndex) parts.push(<span key={idx++}>{str.slice(lastIndex, match.index)}</span>)
        if (match[1]) parts.push(<strong key={idx++} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{match[1]}</strong>)
        else if (match[2]) parts.push(<em key={idx++}>{match[2]}</em>)
        else if (match[3]) parts.push(<code key={idx++} style={{ background: 'rgba(59,130,246,0.15)', padding: '1px 6px', borderRadius: 4, fontSize: '0.9em', color: '#93c5fd', fontFamily: 'monospace' }}>{match[3]}</code>)
        lastIndex = regex.lastIndex
      }
      if (lastIndex < str.length) parts.push(<span key={idx++}>{str.slice(lastIndex)}</span>)
      return parts.length ? parts : str
    }

    // Bullet list items
    if (/^[-*•]\s/.test(line)) {
      elements.push(
        <div key={key++} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--accent-blue)', marginTop: 2, flexShrink: 0 }}>•</span>
          <span style={{ lineHeight: 1.6 }}>{formatInline(line.replace(/^[-*•]\s/, ''))}</span>
        </div>
      )
      continue
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s(.*)/)
    if (numMatch) {
      elements.push(
        <div key={key++} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--accent-blue)', fontWeight: 700, flexShrink: 0, minWidth: 20 }}>{numMatch[1]}.</span>
          <span style={{ lineHeight: 1.6 }}>{formatInline(numMatch[2])}</span>
        </div>
      )
      continue
    }

    // Normal text line
    elements.push(
      <div key={key++} style={{ lineHeight: 1.7, marginBottom: 2 }}>{formatInline(line)}</div>
    )
  }

  return elements
}

// ─── Step constants ─────────────────────────────────────────────────────────────────
const STEPS = {
  UPLOAD: 0,
  JD: 1,
  TAILOR: 2,
  INTERVIEW: 3,
  CHAT: 4,
}

const ROUND_TYPES = ['HR', 'Technical', 'Coding', 'System Design', 'Behavioral']
const FOCUS_OPTIONS = [
  'General Career Coaching',
  'HR Round Prep',
  'Technical Round Prep',
  'System Design Round Prep',
  'Behavioral Round Prep',
  'Skill Gap Analysis',
]
const QUICK_PROMPTS = [
  'What are my strongest points?',
  "How do I answer 'Tell me about yourself'?",
  'Give me a tough technical question',
  'What skills am I missing?',
]

// ─── Score Ring ────────────────────────────────────────────────────────────
function ScoreRing({ value, label }) {
  const r = 42; const circ = 2 * Math.PI * r
  const filled = circ * (1 - value / 100)
  const color = value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto' }}>
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="48" cy="48" r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
          <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={filled} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color }}>{Math.round(value)}</div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{label}</div>
    </div>
  )
}

// ─── Step Indicator ────────────────────────────────────────────────────────
function StepIndicator({ current, completed }) {
  const steps = [
    { label: 'Resume', icon: '📄' },
    { label: 'Job', icon: '💼' },
    { label: 'Tailor', icon: '✨' },
    { label: 'Interview', icon: '🎤' },
    { label: 'Coach', icon: '💬' },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 36 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: completed > i ? 'pointer' : 'default',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              background: i === current ? 'var(--gradient-brand)' : completed > i ? 'rgba(16,185,129,0.2)' : 'var(--bg-elevated)',
              border: i === current ? 'none' : completed > i ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border)',
              boxShadow: i === current ? '0 0 20px rgba(59,130,246,0.4)' : 'none',
              transition: 'all 0.3s ease',
            }}>
              {completed > i ? '✓' : s.icon}
            </div>
            <span style={{ fontSize: 11, fontWeight: i === current ? 700 : 400, color: i === current ? 'var(--accent-blue)' : completed > i ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 48, height: 1, background: completed > i ? 'rgba(16,185,129,0.4)' : 'var(--border)', margin: '0 4px', marginBottom: 20, transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function MainApp() {
  const navigate = useNavigate()
  const { resumeData, setResumeData, jdData, setJdData, resumeId, setResumeId, sessionId, reset } = useApp()
  const [step, setStep] = useState(() => {
    const saved = parseInt(localStorage.getItem('hiremind_step') || '0')
    // Only restore to a step we have data for
    if (saved >= STEPS.TAILOR && (!resumeData || !jdData)) return STEPS.UPLOAD
    if (saved >= STEPS.JD && !resumeData) return STEPS.UPLOAD
    return saved
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Resume
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  // JD
  const [jdMode, setJdMode] = useState('text')
  const [jdText, setJdText] = useState('')
  const [jdUrl, setJdUrl] = useState('')

  // Tailor
  const [tailorResult, setTailorResultState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hiremind_tailor')) || null } catch { return null }
  })
  const setTailorResult = (val) => {
    setTailorResultState(val)
    if (val) localStorage.setItem('hiremind_tailor', JSON.stringify(val))
    else localStorage.removeItem('hiremind_tailor')
  }
  const [downloading, setDownloading] = useState(false)

  // Interview
  const [selectedRound, setSelectedRound] = useState(null)
  const [interviewResult, setInterviewResult] = useState(null)
  const [expandedQ, setExpandedQ] = useState(null)

  // Chat
  const [focus, setFocus] = useState(() => localStorage.getItem('hiremind_focus') || 'General Career Coaching')
  const [sessionStarted, setSessionStarted] = useState(() => {
    return localStorage.getItem('hiremind_session_started') === 'true'
  })
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hiremind_messages')) || [] } catch { return [] }
  })
  const [profileOpen, setProfileOpen] = useState(false)
  const userRef = useRef(null)
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('hiremind_user')) } catch { return null }
  })()
  const userName = storedUser?.full_name || storedUser?.email?.split('@')[0] || ''
  const userEmail = storedUser?.email || ''
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Persist step
  useEffect(() => { localStorage.setItem('hiremind_step', step) }, [step])

  // Persist focus
  useEffect(() => { localStorage.setItem('hiremind_focus', focus) }, [focus])

  // Persist chat session
  useEffect(() => {
    localStorage.setItem('hiremind_session_started', sessionStarted ? 'true' : 'false')
  }, [sessionStarted])

  // Persist messages
  useEffect(() => {
    localStorage.setItem('hiremind_messages', JSON.stringify(messages))
  }, [messages])

  const completed = step

  // ─── STEP 0: Resume Upload ──────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
      setError('Only PDF or DOCX files are accepted.'); return
    }
    setLoading(true); setError(null)
    try {
      const res = await uploadResume(file)
      setResumeData(res.data)
      setResumeId(crypto.randomUUID())
      setStep(STEPS.JD)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to parse resume. Check your backend is running.')
    } finally { setLoading(false) }
  }

  // ─── STEP 1: Job Description ────────────────────────────────────────────
  const handleAnalyzeJD = async () => {
    if (jdMode === 'text' && !jdText.trim()) { setError('Paste a job description first.'); return }
    if (jdMode === 'url' && !jdUrl.trim()) { setError('Enter a URL first.'); return }
    setLoading(true); setError(null)
    try {
      const res = await analyzeJobDescription(jdMode === 'text' ? jdText : null, jdMode === 'url' ? jdUrl : null)
      setJdData(res.data)
      setStep(STEPS.TAILOR)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to analyze job description.')
    } finally { setLoading(false) }
  }

  // ─── STEP 2: Tailor ─────────────────────────────────────────────────────
  const handleTailor = async () => {
    setLoading(true); setError(null)
    try {
      const res = await tailorResume(resumeData, jdData, resumeId)
      setTailorResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Tailoring failed.')
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
      window.URL.revokeObjectURL(url)
    } catch (e) {
      setError('Failed to download resume. Please try again.')
    } finally { setDownloading(false) }
  }

  // ─── STEP 3: Interview ──────────────────────────────────────────────────
  const handleGenerateQuestions = async (roundType) => {
    setSelectedRound(roundType); setLoading(true); setError(null); setInterviewResult(null); setExpandedQ(null)
    try {
      const res = await generateQuestions(resumeId, resumeData, jdData, roundType)
      setInterviewResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to generate questions.')
    } finally { setLoading(false) }
  }

  // ─── STEP 4: Chat ───────────────────────────────────────────────────────
  const handleStartSession = async () => {
    setLoading(true); setError(null)
    try {
      await startSession(sessionId, resumeId, resumeData, jdData, focus)
      setSessionStarted(true)
      setMessages([{ role: 'ai', text: `Hey ${resumeData.name.split(' ')[0]}! 👋 I'm your HireMind AI coach. Let's prep you for **${jdData.job_title}** at **${jdData.company_name || 'the company'}**.\n\nFocus: **${focus}**\n\nAsk me anything!` }])
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to start session.')
    } finally { setLoading(false) }
  }

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim(); setChatInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setChatLoading(true)
    try {
      const res = await sendChat(sessionId, msg)
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '❌ Something went wrong. Please try again.' }])
    } finally { setChatLoading(false) }
  }

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('access_token')
    localStorage.removeItem('hiremind_user')
    localStorage.removeItem('hiremind_resume')
    localStorage.removeItem('hiremind_jd')
    localStorage.removeItem('hiremind_resume_id')
    localStorage.removeItem('hiremind_session_id')
    localStorage.removeItem('hiremind_step')
    localStorage.removeItem('hiremind_tailor')
    localStorage.removeItem('hiremind_messages')
    localStorage.removeItem('hiremind_session_started')
    localStorage.removeItem('hiremind_focus')
    navigate('/auth', { replace: true })
  }

  const handleReset = () => {
    reset()
    setStep(0)
    setTailorResult(null)
    setInterviewResult(null)
    setSelectedRound(null)
    setSessionStarted(false)
    setMessages([])
    setJdText('')
    setJdUrl('')
    localStorage.removeItem('hiremind_step')
    localStorage.removeItem('hiremind_tailor')
    localStorage.removeItem('hiremind_messages')
    localStorage.removeItem('hiremind_session_started')
    localStorage.removeItem('hiremind_focus')
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: 'Inter, sans-serif' }}>
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,11,20,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)', height: 60,
        display: 'flex', alignItems: 'center', padding: '0 24px',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: 'var(--gradient-brand)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧠</div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HireMind AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {resumeData && <span style={{ fontSize: 12, padding: '3px 10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, color: '#34d399' }}>✓ {resumeData.name}</span>}
          {jdData && <span style={{ fontSize: 12, padding: '3px 10px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 20, color: '#60a5fa' }}>✓ {jdData.job_title}</span>}
          <button onClick={handleReset} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>↺ Reset</button>

          {/* ── Profile Dropdown ── */}
          <div ref={userRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '5px 12px 5px 5px',
                color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'var(--gradient-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'white',
              }}>
                {userName ? userName.charAt(0).toUpperCase() : '?'}
              </div>
              <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName || 'User'}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', transition: 'transform 0.2s', transform: profileOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
            </button>

            {profileOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '8px', minWidth: 200,
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                animation: 'fadeInUp 0.15s ease', zIndex: 200,
              }}>
                {/* User info */}
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{userName || 'User'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{userEmail || ''}</div>
                </div>

                {/* Logout */}
                <button
                  onClick={() => { setProfileOpen(false); handleLogout() }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    color: '#f87171', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    background: 'transparent', border: 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
        <StepIndicator current={step} completed={completed} />
        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, color: '#f87171', fontSize: 14 }}>
            ❌ {error}
          </div>
        )}

        {/* ── STEP 0: UPLOAD ───────────────────────────── */}
        {step === STEPS.UPLOAD && (
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.03em' }}>
                Start with your <span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Resume</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>AI will parse every detail and build your complete profile.</p>
            </div>
            <div
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent-blue)' : 'var(--border)'}`,
                borderRadius: 16, padding: '48px 32px', textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'var(--accent-blue-glow)' : 'var(--bg-secondary)', transition: 'all 0.2s',
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current?.click()}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>☁️</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Drop your resume here</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>PDF or DOCX · Max 10MB</div>
              <button style={{
                background: 'var(--gradient-brand)', color: 'white', border: 'none', borderRadius: 10,
                padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                display: 'inline-flex', alignItems: 'center', gap: 8, opacity: loading ? 0.7 : 1,
              }} disabled={loading}>
                {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Parsing...</> : '📤 Choose File'}
              </button>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={e => handleFile(e.target.files[0])} />
          </div>
        )}

        {/* ── STEP 1: JD ───────────────────────────────── */}
        {step === STEPS.JD && (
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💼</div>
              <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.03em' }}>
                Add the <span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Job Description</span>
              </h1>
              <div style={{ display: 'inline-flex', gap: 8, padding: 4, background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--accent-green)' }}>✓ Resume ready: {resumeData?.name}</div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['text', 'url'].map(m => (
                  <button key={m} onClick={() => setJdMode(m)} style={{
                    padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    border: 'none', fontFamily: 'Inter, sans-serif',
                    background: jdMode === m ? 'var(--gradient-brand)' : 'var(--bg-elevated)',
                    color: jdMode === m ? 'white' : 'var(--text-secondary)',
                  }}>
                    {m === 'text' ? '📝 Paste Text' : '🔗 From URL'}
                  </button>
                ))}
              </div>
              {jdMode === 'text' ? (
                <textarea
                  style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Inter, sans-serif', minHeight: 200, resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }}
                  placeholder="Paste the full job description here..."
                  value={jdText} onChange={e => setJdText(e.target.value)}
                />
              ) : (
                <input
                  style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                  type="url" placeholder="https://company.com/careers/role..." value={jdUrl} onChange={e => setJdUrl(e.target.value)}
                />
              )}
              <button onClick={handleAnalyzeJD} disabled={loading} style={{
                marginTop: 16, width: '100%', background: 'var(--gradient-brand)', color: 'white', border: 'none',
                borderRadius: 10, padding: '13px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Analyzing...</> : '🔍 Analyze Job Description'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: TAILOR ───────────────────────────── */}
        {step === STEPS.TAILOR && (
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
              <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
                AI <span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Resume Tailor</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{resumeData?.name} → {jdData?.job_title} at {jdData?.company_name || 'Company'}</p>
            </div>

            {!tailorResult ? (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 36, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                  AI will compare your resume against the JD using RAG retrieval, score it for ATS compatibility, identify gaps, and generate line-by-line improvements.
                </p>
                <button onClick={handleTailor} disabled={loading} style={{
                  background: 'var(--gradient-brand)', color: 'white', border: 'none', borderRadius: 12,
                  padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                }}>
                  {loading ? <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Analyzing (15-30s)...</> : '✨ Tailor My Resume'}
                </button>
              </div>
            ) : (
              <div>
                {/* Score cards */}
                <div style={{ display: 'flex', gap: 20, justifyContent: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px', marginBottom: 20 }}>
                  <ScoreRing value={tailorResult.ats_score} label="ATS Score" />
                  <div style={{ width: 1, background: 'var(--border)' }} />
                  <ScoreRing value={tailorResult.job_match_percent} label="Job Match" />
                  <div style={{ width: 1, background: 'var(--border)' }} />
                  <div style={{ textAlign: 'center', alignSelf: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-red)' }}>{tailorResult.missing_skills?.length || 0}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Missing Skills</div>
                  </div>
                  <div style={{ textAlign: 'center', alignSelf: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-green)' }}>{tailorResult.suggestions?.length || 0}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Improvements</div>
                  </div>
                </div>

                {/* Strengths / Gaps */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-green)', marginBottom: 12 }}>💪 Strengths</div>
                    {tailorResult.strengths?.map((s, i) => <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', gap: 8 }}><span>✅</span>{s}</div>)}
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-orange)', marginBottom: 12 }}>⚠️ Gaps</div>
                    {tailorResult.weaknesses?.map((w, i) => <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', gap: 8 }}><span>🔸</span>{w}</div>)}
                  </div>
                </div>

                {/* Missing keywords */}
                {tailorResult.missing_keywords?.length > 0 && (
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>🔑 Missing Keywords to Add</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {tailorResult.missing_keywords.map(k => (
                        <span key={k} style={{ padding: '3px 10px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, color: '#fbbf24', fontSize: 12, fontWeight: 600 }}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Line-by-line suggestions */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>✏️ Line-by-Line Improvements</div>
                  {tailorResult.suggestions?.map((s, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.07)', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-red)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>❌ Original</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{s.original_line}</div>
                      </div>
                      <div style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.07)', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-green)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>✅ Improved</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, color: '#34d399' }}>{s.improved_line}</div>
                      </div>
                      <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>💡 {s.reason}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                  {tailorResult.optimized_resume && (
                    <button onClick={handleDownload} disabled={downloading} style={{
                      width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none',
                      borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: downloading ? 0.8 : 1,
                    }}>
                      {downloading
                        ? <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Downloading...</>
                        : '📥 Download Optimized Resume (.docx)'}
                    </button>
                  )}
                  <button onClick={() => setStep(STEPS.INTERVIEW)} style={{
                    width: '100%', background: 'var(--gradient-brand)', color: 'white', border: 'none',
                    borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}>
                    Next: Generate Interview Questions →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: INTERVIEW ────────────────────────── */}
        {step === STEPS.INTERVIEW && (
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎤</div>
              <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
                <span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Interview Prep</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Pick a round type to get tailored questions</p>
            </div>

            {/* Round selector */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
              {ROUND_TYPES.map(r => (
                <button key={r} onClick={() => handleGenerateQuestions(r)} disabled={loading && selectedRound === r} style={{
                  padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  border: selectedRound === r ? 'none' : '1px solid var(--border)', fontFamily: 'Inter, sans-serif',
                  background: selectedRound === r ? 'var(--gradient-brand)' : 'var(--bg-secondary)',
                  color: selectedRound === r ? 'white' : 'var(--text-secondary)',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s',
                }}>
                  {loading && selectedRound === r ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : null}
                  {r}
                </button>
              ))}
            </div>

            {interviewResult && (
              <div>
                {/* Tips */}
                {interviewResult.preparation_tips?.length > 0 && (
                  <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: 16, marginBottom: 18 }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: 13, marginBottom: 10 }}>💡 Prep Tips</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {interviewResult.preparation_tips.map((t, i) => <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 6 }}><span>→</span>{t}</div>)}
                    </div>
                  </div>
                )}

                {/* Questions */}
                {interviewResult.questions?.map((q, i) => (
                  <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', marginBottom: 10, background: 'var(--bg-secondary)', transition: 'border-color 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, marginTop: 2, flexShrink: 0 }}>Q{i+1}</span>
                        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{q.question}</div>
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0,
                        background: q.difficulty === 'Hard' ? 'rgba(239,68,68,0.15)' : q.difficulty === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                        color: q.difficulty === 'Hard' ? '#f87171' : q.difficulty === 'Medium' ? '#fbbf24' : '#34d399',
                      }}>{q.difficulty}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>🤔 {q.why_asked}</div>
                    {expandedQ === i ? (
                      <>
                        <div style={{ fontSize: 13, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px 12px', color: '#93c5fd', marginTop: 8 }}>💡 {q.ideal_answer_hint}</div>
                        {q.follow_up && <div style={{ fontSize: 13, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, padding: '10px 12px', color: '#c4b5fd', marginTop: 6 }}>🔁 Follow-up: {q.follow_up}</div>}
                        <button onClick={() => setExpandedQ(null)} style={{ marginTop: 10, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>▲ Hide hints</button>
                      </>
                    ) : (
                      <button onClick={() => setExpandedQ(i)} style={{ marginTop: 6, background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>▼ Show answer hints</button>
                    )}
                  </div>
                ))}

                <button onClick={() => setStep(STEPS.CHAT)} style={{
                  width: '100%', marginTop: 8, background: 'var(--gradient-brand)', color: 'white', border: 'none',
                  borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}>
                  Next: Chat with AI Coach →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: CHAT ─────────────────────────────── */}
        {step === STEPS.CHAT && (
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
                <span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Career Coach</span>
              </h1>
            </div>

            {!sessionStarted ? (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 8 }}>Choose your focus area</label>
                  <select value={focus} onChange={e => setFocus(e.target.value)} style={{
                    background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px',
                    color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Inter, sans-serif', width: '100%', outline: 'none',
                  }}>
                    {FOCUS_OPTIONS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <button onClick={handleStartSession} disabled={loading} style={{
                  background: 'var(--gradient-brand)', color: 'white', border: 'none', borderRadius: 10,
                  padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                  {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Starting...</> : '🚀 Start Coaching Session'}
                </button>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                {/* chat header */}
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>HireMind Coach</span>
                  <span style={{ fontSize: 12, padding: '2px 10px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, color: '#60a5fa' }}>{focus}</span>
                </div>

                {/* messages */}
                <div style={{ height: 400, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {messages.map((m, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', animation: 'fadeInUp 0.3s ease' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: m.role === 'ai' ? 'var(--gradient-brand)' : 'var(--bg-elevated)', border: m.role !== 'ai' ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                        {m.role === 'ai' ? '🧠' : '👤'}
                      </div>
                      <div style={{
                        maxWidth: '75%', padding: '12px 16px', borderRadius: 12, fontSize: 14, lineHeight: 1.65,
                        background: m.role === 'ai' ? 'var(--bg-card)' : 'var(--gradient-brand)',
                        border: m.role === 'ai' ? '1px solid var(--border)' : 'none',
                        color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                        borderBottomLeftRadius: m.role === 'ai' ? 4 : 12,
                        borderBottomRightRadius: m.role === 'user' ? 4 : 12,
                      }}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🧠</div>
                      <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                        <span style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* quick prompts */}
                <div style={{ padding: '8px 14px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
                  {QUICK_PROMPTS.map(p => (
                    <button key={p} onClick={() => setChatInput(p)} style={{ fontSize: 12, padding: '5px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{p}</button>
                  ))}
                </div>

                {/* input */}
                <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border)' }}>
                  <input
                    style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none' }}
                    placeholder="Ask your coach anything..."
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendChat())}
                  />
                  <button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()} style={{
                    background: 'var(--gradient-brand)', color: 'white', border: 'none', borderRadius: 10,
                    padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}>
                    ↗
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
