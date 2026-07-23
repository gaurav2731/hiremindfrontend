import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import JobPage from '../pages/JobPage'

const mockSetJdData = vi.fn()

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    jdData: null,
    setJdData: mockSetJdData,
    resumeData: null,
  }),
}))

vi.mock('../api/hiremind', () => ({
  analyzeJobDescription: vi.fn(),
}))

import { analyzeJobDescription } from '../api/hiremind'

function renderJobPage() {
  return render(
    <BrowserRouter>
      <JobPage />
    </BrowserRouter>
  )
}

describe('JobPage - Input State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', () => {
    renderJobPage()
    expect(screen.getByText('💼 Job Description Analyzer')).toBeDefined()
  })

  it('shows text mode by default', () => {
    renderJobPage()
    expect(screen.getByText('📝 Paste Text')).toBeDefined()
    expect(screen.getByPlaceholderText('Paste the full job description here...')).toBeDefined()
  })

  it('switches to URL mode', async () => {
    renderJobPage()
    await userEvent.click(screen.getByText('🔗 From URL'))
    expect(screen.getByPlaceholderText('https://careers.company.com/job/...')).toBeDefined()
  })

  it('shows error when submitting empty text', async () => {
    renderJobPage()
    await userEvent.click(screen.getByText('🔍 Analyze Job Description'))
    expect(screen.getByText('❌ Please paste a job description.')).toBeDefined()
  })

  it('calls analyze API with text', async () => {
    analyzeJobDescription.mockResolvedValue({
      data: { job_title: 'Engineer', company_name: 'TestCo', required_skills: [] },
    })

    renderJobPage()
    const textarea = screen.getByPlaceholderText('Paste the full job description here...')
    await userEvent.type(textarea, 'We need a Python developer')
    await userEvent.click(screen.getByText('🔍 Analyze Job Description'))

    await waitFor(() => {
      expect(analyzeJobDescription).toHaveBeenCalledWith(
        'We need a Python developer',
        null
      )
    })
  })

  it('shows error on API failure', async () => {
    analyzeJobDescription.mockRejectedValue({
      response: { data: { detail: 'Analysis failed' } },
    })

    renderJobPage()
    const textarea = screen.getByPlaceholderText('Paste the full job description here...')
    await userEvent.type(textarea, 'We need a Python developer')
    await userEvent.click(screen.getByText('🔍 Analyze Job Description'))

    await waitFor(() => {
      expect(screen.getByText('❌ Analysis failed')).toBeDefined()
    })
  })
})

describe('JobPage - Results State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mock('../context/AppContext', () => ({
      useApp: () => ({
        jdData: {
          job_title: 'Senior Python Developer',
          company_name: 'TechCorp',
          required_skills: [
            { name: 'Python', priority: 'High' },
            { name: 'Django', priority: 'Medium' },
          ],
          tech_stack: [{ name: 'AWS', priority: 'High' }],
          responsibilities: ['Build APIs', 'Mentor juniors'],
          keywords: ['microservices', 'CI/CD'],
          experience_level: 'Senior (5+ years)',
        },
        setJdData: mockSetJdData,
        resumeData: { name: 'Test User' },
      }),
    }))
  })

  it('renders analyzed job data', async () => {
    const { default: JobPage } = await import('../pages/JobPage')
    render(
      <BrowserRouter>
        <JobPage />
      </BrowserRouter>
    )

    expect(screen.getByText('✅ Job description analyzed!')).toBeDefined()
    expect(screen.getByText('Senior Python Developer')).toBeDefined()
    expect(screen.getByText('TechCorp')).toBeDefined()
  })
})
