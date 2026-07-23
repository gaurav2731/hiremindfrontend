import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { startSession, sendChat } from '../api/hiremind'
import MarkdownRenderer from '../components/MarkdownRenderer'

const FOCUS_OPTIONS = [
  'General Career Coaching',
  'HR Round Prep',
  'Technical Round Prep',
  'System Design Round Prep',
  'Behavioral Round Prep',
  'Resume Improvement',
  'Skill Gap Analysis',
  'Salary Negotiation',
]

const PROFESSIONS = [
  { value: 'Software Engineering', label: 'Software Engineering', icon: '💻' },
  { value: 'Nursing', label: 'Nursing', icon: '🩺' },
  { value: 'Data Science', label: 'Data Science', icon: '📊' },
  { value: 'Product Management', label: 'Product Management', icon: '📱' },
  { value: 'Marketing', label: 'Marketing', icon: '📈' },
  { value: 'Finance', label: 'Finance', icon: '💰' },
  { value: 'Human Resources', label: 'Human Resources', icon: '👥' },
  { value: 'General', label: 'General', icon: '🎯' },
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`chat-msg ${isUser ? 'user' : ''}`}>
      <div className={`chat-avatar ${isUser ? 'user' : 'ai'}`}>
        {isUser ? '👤' : '🧠'}
      </div>
      <div className={`chat-bubble ${isUser ? 'user' : 'ai'}`}>
        {isUser ? (
          msg.content
        ) : (
          <MarkdownRenderer content={msg.content} />
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { resumeData, jdData, sessionId, resumeId } = useApp()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [focus, setFocus] = useState('General Career Coaching')
  const [profession, setProfession] = useState('Software Engineering')
  const [sessionStarted, setSessionStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStart = async () => {
    if (!resumeData || !jdData) return
    setStarting(true); setError(null)
    try {
      await startSession(sessionId, resumeId, resumeData, jdData, focus, profession)
      setSessionStarted(true)
      setMessages([{
        role: 'assistant',
        content: `Hi ${resumeData.name}! 👋 I'm your HireMind AI career coach. I'm here to help you prepare for the **${jdData.job_title}** role at **${jdData.company_name || 'the company'}**.\n\n**Profession:** ${profession}\n**Current focus:** ${focus}\n\nAsk me anything — interview questions, resume tips, skill gaps, mock feedback, or just tell me where you want to start!`
      }])
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to start session.')
    } finally { setStarting(false) }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const res = await sendChat(sessionId, userMsg)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Sorry, something went wrong. Please try again.' }])
    } finally { setLoading(false) }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!resumeData || !jdData) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-icon">💬</div>
        <div className="empty-title">AI Coach Not Ready</div>
        <div className="empty-desc">The AI coach needs your resume and job description to give personalized advice. Please set them up first.</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {!resumeData && <button className="btn btn-primary" onClick={() => navigate('/resume')}>Upload Resume</button>}
          {!jdData && <button className="btn btn-secondary" onClick={() => navigate('/job')}>Add Job Description</button>}
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>💬 AI Career Coach</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Personal coaching for any profession — focused, grounded, and always honest.</p>
      </div>

      {!sessionStarted ? (
        <div className="card" style={{ maxWidth: 600 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🧠</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Start Your Coaching Session</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            Coaching for <strong>{resumeData.name}</strong> → <strong>{jdData.job_title}</strong>
          </p>

          {/* Profession Selector */}
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label className="input-label">Choose Your Profession</label>
            <select className="select" value={profession} onChange={e => setProfession(e.target.value)}>
              {PROFESSIONS.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
            </select>
          </div>

          {/* Focus Selector */}
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label">Choose Your Focus Area</label>
            <select className="select" value={focus} onChange={e => setFocus(e.target.value)}>
              {FOCUS_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>❌ {error}</div>}
          <button className="btn btn-primary btn-full" onClick={handleStart} disabled={starting}>
            {starting ? <><span className="spinner" /> Starting...</> : '🚀 Start Session'}
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-green)' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>AI Coach Active</span>
              <span className="badge badge-blue">{focus}</span>
              <span className="badge badge-purple" style={{ fontSize: 11 }}>{profession}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSessionStarted(false); setMessages([]) }}>
              ↩ Change Settings
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages" style={{ background: 'var(--bg-primary)', minHeight: 400, maxHeight: 500 }}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && (
              <div className="chat-msg">
                <div className="chat-avatar ai">🧠</div>
                <div className="chat-bubble ai" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="spinner" /> Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chat-input-row">
            <textarea
              className="chat-input"
              rows={1}
              placeholder="Ask anything about your interview prep..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ resize: 'none', height: 42, lineHeight: '22px' }}
            />
            <button className="btn btn-primary" onClick={handleSend} disabled={loading || !input.trim()}>
              Send ↗
            </button>
          </div>

          {/* Quick prompts */}
          <div style={{ padding: '10px 16px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {quickPrompts.map(p => (
              <button key={p} className="btn btn-secondary btn-sm" onClick={() => setInput(p)} style={{ fontSize: 12 }}>{p}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const quickPrompts = [
  'What are my strongest points?',
  'What skills am I missing?',
  'Give me a mock question',
  'How should I answer "Tell me about yourself"?',
]
