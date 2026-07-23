import axios from 'axios'

// ─── API Base URL ───────────────────────────────────────────────────────
//
// In development, Vite proxies /api → localhost:8000 (see vite.config.js).
// In production (separate frontend/backend deploys on Vercel), you MUST set
// VITE_API_URL in the frontend Vercel project to the backend's deployed URL
//   e.g.  https://hiremind-ai-backend.vercel.app
// If unset, falls back to '/api' (same-origin — fine only for monolith deploys).
//
const baseURL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') + '/api'
  : '/api'

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Auth request interceptor ───────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Auth response interceptor ──────────────────────────────────────────
// If the backend returns 401, the token has expired or is invalid.
// Clear auth state and redirect to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('hiremind_user')
      // Only redirect if we're not already on the auth page
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)
