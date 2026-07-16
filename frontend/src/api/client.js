import axios from 'axios'

// In dev, Vite proxies /api to the FastAPI backend (see vite.config.js).
// In production, use the VITE_API_URL environment variable.
const baseURL = import.meta.env.VITE_API_URL || '/api'

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
