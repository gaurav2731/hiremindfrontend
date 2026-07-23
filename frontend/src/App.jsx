import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import MainApp from './pages/MainApp'
import ErrorBoundary from './components/ErrorBoundary'

function AuthGuard({ children }) {
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hiremind_user')) } catch { return null }
  })

  // Re-check when localStorage changes (e.g. after login)
  useEffect(() => {
    const check = () => {
      setToken(localStorage.getItem('access_token'))
      try { setUser(JSON.parse(localStorage.getItem('hiremind_user'))) } catch { setUser(null) }
    }
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])

  if (!token) {
    return <Navigate to="/auth" replace />
  }

  // Render children and pass user info
  return typeof children === 'function' ? children(user) : children
}

function AuthPageWithNavigate() {
  const navigate = useNavigate()
  return (
    <AuthPage onAuth={(token, user) => {
      localStorage.setItem('access_token', token)
      localStorage.setItem('hiremind_user', JSON.stringify(user))
      navigate('/app', { replace: true })
    }} />
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPageWithNavigate />} />
            <Route path="/app/*" element={
              <AuthGuard>
                <MainApp />
              </AuthGuard>
            } />
            {/* Redirect /app to main app, any other unknown route to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AppProvider>
  )
}
