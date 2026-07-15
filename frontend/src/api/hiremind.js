import { apiClient } from './client'

// ─── Auth ───────────────────────────────────────────────────────────────
export const login = (email, password) =>
  apiClient.post('/auth/login', { email, password })

export const register = (email, password, fullName) =>
  apiClient.post('/auth/register', { email, password, full_name: fullName })

// ─── Resume ─────────────────────────────────────────────────────────────
export const uploadResume = (file) => {
  const form = new FormData()
  form.append('file', file)
  return apiClient.post('/resume/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const tailorResume = (resumeData, jdData, resumeId) =>
  apiClient.post('/resume/tailor', {
    resume_data: resumeData,
    jd_data: jdData,
    resume_id: resumeId,
  })

export const generateRoadmap = (resumeData, jdData, resumeId) =>
  apiClient.post('/resume/roadmap', { resume_data: resumeData, jd_data: jdData, resume_id: resumeId })

export const downloadResume = (resumeData) =>
  apiClient.post('/resume/download', resumeData, { responseType: 'blob' })

// ─── Job ─────────────────────────────────────────────────────────────────
export const analyzeJobDescription = (text, url) =>
  apiClient.post('/job/analyze', { text, url })

// ─── Interview ───────────────────────────────────────────────────────────
export const startSession = (sessionId, resumeId, resumeData, jdData, focus) =>
  apiClient.post('/interview/session/start', {
    session_id: sessionId,
    resume_id: resumeId,
    resume_data: resumeData,
    jd_data: jdData,
    focus,
  })

export const sendChat = (sessionId, message) =>
  apiClient.post('/interview/chat', { session_id: sessionId, message })

export const generateQuestions = (resumeId, resumeData, jdData, roundType, numQuestions = 10) =>
  apiClient.post('/interview/questions/generate', {
    resume_id: resumeId,
    resume_data: resumeData,
    jd_data: jdData,
    round_type: roundType,
    num_questions: numQuestions,
  })

// ─── Health ──────────────────────────────────────────────────────────────
export const checkHealth = () => apiClient.get('/health')
