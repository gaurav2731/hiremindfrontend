import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // ── Session data ──────────────────────────────────────────────
  const [resumeData, setResumeData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hiremind_resume')) || null } catch { return null }
  })
  const [jdData, setJdData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hiremind_jd')) || null } catch { return null }
  })
  const [resumeId, setResumeId] = useState(() =>
    localStorage.getItem('hiremind_resume_id') || null
  )
  const [tailorResult, setTailorResult] = useState(null)
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('hiremind_session_id')
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('hiremind_session_id', id) }
    return id
  })

  // ── Persist resume & JD in localStorage ───────────────────────
  useEffect(() => {
    if (resumeData) localStorage.setItem('hiremind_resume', JSON.stringify(resumeData))
    else localStorage.removeItem('hiremind_resume')
  }, [resumeData])

  useEffect(() => {
    if (jdData) localStorage.setItem('hiremind_jd', JSON.stringify(jdData))
    else localStorage.removeItem('hiremind_jd')
  }, [jdData])

  useEffect(() => {
    if (resumeId) localStorage.setItem('hiremind_resume_id', resumeId)
  }, [resumeId])

  const reset = () => {
    setResumeData(null); setJdData(null)
    setResumeId(null); setTailorResult(null)
    localStorage.removeItem('hiremind_resume')
    localStorage.removeItem('hiremind_jd')
    localStorage.removeItem('hiremind_resume_id')
  }

  return (
    <AppContext.Provider value={{
      resumeData, setResumeData,
      jdData, setJdData,
      resumeId, setResumeId,
      tailorResult, setTailorResult,
      sessionId, reset,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
