import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock axios before importing anything
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  }
})

const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
}

// Mock the api client module
vi.mock('../api/client', () => ({
  apiClient: mockApiClient,
}))

// Import after mocks
import { login, register, uploadResume, tailorResume, generateRoadmap, downloadResume, analyzeJobDescription, startSession, sendChat, generateQuestions, checkHealth } from '../api/hiremind'

describe('HireMind API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Auth', () => {
    it('login calls correct endpoint', () => {
      mockApiClient.post.mockResolvedValue({ data: { access_token: 'token' } })
      login('test@test.com', 'pass123')
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'pass123',
      })
    })

    it('register calls correct endpoint', () => {
      mockApiClient.post.mockResolvedValue({ data: { access_token: 'token' } })
      register('test@test.com', 'pass123', 'Test User')
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@test.com',
        password: 'pass123',
        full_name: 'Test User',
      })
    })
  })

  describe('Resume', () => {
    it('uploadResume creates FormData', () => {
      const file = new File(['test'], 'resume.pdf', { type: 'application/pdf' })
      uploadResume(file)
      expect(mockApiClient.post).toHaveBeenCalled()
      const [url, formData, config] = mockApiClient.post.mock.calls[0]
      expect(url).toBe('/resume/upload')
      expect(formData instanceof FormData).toBe(true)
      expect(config.headers['Content-Type']).toBe('multipart/form-data')
    })

    it('tailorResume sends correct data', () => {
      const rData = { name: 'Test' }
      const jData = { job_title: 'Engineer' }
      tailorResume(rData, jData, 'res-1')
      expect(mockApiClient.post).toHaveBeenCalledWith('/resume/tailor', {
        resume_data: rData,
        jd_data: jData,
        resume_id: 'res-1',
      })
    })

    it('generateRoadmap sends correct data', () => {
      generateRoadmap({ name: 'Test' }, { job_title: 'Engineer' }, 'res-1')
      expect(mockApiClient.post).toHaveBeenCalledWith('/resume/roadmap', {
        resume_data: { name: 'Test' },
        jd_data: { job_title: 'Engineer' },
        resume_id: 'res-1',
      })
    })

    it('downloadResume sends correct data with responseType blob', () => {
      downloadResume({ name: 'Test' })
      expect(mockApiClient.post).toHaveBeenCalledWith('/resume/download', { name: 'Test' }, { responseType: 'blob' })
    })
  })

  describe('Job', () => {
    it('analyzeJobDescription with text', () => {
      analyzeJobDescription('Some JD text', null)
      expect(mockApiClient.post).toHaveBeenCalledWith('/job/analyze', {
        text: 'Some JD text',
        url: null,
      })
    })

    it('analyzeJobDescription with url', () => {
      analyzeJobDescription(null, 'https://example.com/job')
      expect(mockApiClient.post).toHaveBeenCalledWith('/job/analyze', {
        text: null,
        url: 'https://example.com/job',
      })
    })
  })

  describe('Interview', () => {
    it('startSession sends correct data', () => {
      startSession('sess-1', 'res-1', { name: 'Test' }, { job_title: 'Engineer' }, 'HR Prep')
      expect(mockApiClient.post).toHaveBeenCalledWith('/interview/session/start', {
        session_id: 'sess-1',
        resume_id: 'res-1',
        resume_data: { name: 'Test' },
        jd_data: { job_title: 'Engineer' },
        focus: 'HR Prep',
      })
    })

    it('sendChat sends message', () => {
      sendChat('sess-1', 'Hello coach')
      expect(mockApiClient.post).toHaveBeenCalledWith('/interview/chat', {
        session_id: 'sess-1',
        message: 'Hello coach',
      })
    })

    it('generateQuestions sends correct data', () => {
      generateQuestions('res-1', { name: 'Test' }, { job_title: 'Engineer' }, 'Technical', 5)
      expect(mockApiClient.post).toHaveBeenCalledWith('/interview/questions/generate', {
        resume_id: 'res-1',
        resume_data: { name: 'Test' },
        jd_data: { job_title: 'Engineer' },
        round_type: 'Technical',
        num_questions: 5,
      })
    })
  })

  describe('Health', () => {
    it('checkHealth calls correct endpoint', () => {
      checkHealth()
      expect(mockApiClient.get).toHaveBeenCalledWith('/health')
    })
  })
})

describe('API Client Interceptors', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('request interceptor adds auth token when present', () => {
    localStorage.setItem('access_token', 'test-token')
    const config = { headers: {} }
    const useCallback = mockApiClient.interceptors.request.use.mock.calls[0][0]
    const result = useCallback(config)
    expect(result.headers.Authorization).toBe('Bearer test-token')
  })

  it('request interceptor skips when no token', () => {
    const config = { headers: {} }
    const useCallback = mockApiClient.interceptors.request.use.mock.calls[0][0]
    const result = useCallback(config)
    expect(result.headers.Authorization).toBeUndefined()
  })

  it('response interceptor handles 401 by clearing storage', () => {
    localStorage.setItem('access_token', 'old-token')
    localStorage.setItem('hiremind_user', JSON.stringify({ name: 'Test' }))

    const errorCallback = mockApiClient.interceptors.response.use.mock.calls[0][1]
    const error = { response: { status: 401 } }

    expect(() => errorCallback(error)).rejects.toBe(error)
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('hiremind_user')).toBeNull()
  })

  it('response interceptor passes through non-401 errors', () => {
    const error = { response: { status: 500 } }
    const errorCallback = mockApiClient.interceptors.response.use.mock.calls[0][1]

    expect(() => errorCallback(error)).rejects.toBe(error)
  })
})
