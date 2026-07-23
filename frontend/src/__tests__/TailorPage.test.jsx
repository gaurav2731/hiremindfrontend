import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import TailorPage from '../pages/TailorPage'

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    resumeData: { name: 'John Doe', skills: ['Python', 'React'] },
    jdData: { job_title: 'Senior Engineer', company_name: 'TechCo' },
    resumeId: 'res-123',
    tailorResult: null,
    setTailorResult: vi.fn(),
  }),
}))

vi.mock('../api/hiremind', () => ({
  tailorResume: vi.fn(),
  downloadResume: vi.fn(),
}))

import { tailorResume, downloadResume } from '../api/hiremind'

function renderTailorPage() {
  return render(
    <BrowserRouter>
      <TailorPage />
    </BrowserRouter>
  )
}

describe('TailorPage - Ready State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows candidate and target role info', () => {
    renderTailorPage()
    expect(screen.getByText('John Doe')).toBeDefined()
    expect(screen.getByText('Senior Engineer')).toBeDefined()
    expect(screen.getByText('TechCo')).toBeDefined()
  })

  it('shows tailor button', () => {
    renderTailorPage()
    expect(screen.getByText('✨ Tailor My Resume')).toBeDefined()
  })

  it('calls tailorResume on button click', async () => {
    tailorResume.mockResolvedValue({
      data: {
        ats_score: 85,
        job_match_percent: 72,
        strengths: ['Strong Python skills'],
        weaknesses: ['Missing Docker'],
        missing_skills: ['Docker'],
        missing_keywords: ['CI/CD'],
        suggestions: [
          { original_line: 'Old line', improved_line: 'New line', reason: 'Better wording' },
        ],
        optimized_resume: { name: 'John Doe' },
      },
    })

    renderTailorPage()
    await userEvent.click(screen.getByText('✨ Tailor My Resume'))

    await waitFor(() => {
      expect(tailorResume).toHaveBeenCalled()
    })

    expect(screen.getByText('85')).toBeDefined()
    expect(screen.getByText('72')).toBeDefined()
  })

  it('shows error on tailor failure', async () => {
    tailorResume.mockRejectedValue({
      response: { data: { detail: 'Tailoring failed' } },
    })

    renderTailorPage()
    await userEvent.click(screen.getByText('✨ Tailor My Resume'))

    await waitFor(() => {
      expect(screen.getByText('❌ Tailoring failed')).toBeDefined()
    })
  })
})

describe('TailorPage - Results State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mock('../context/AppContext', () => ({
      useApp: () => ({
        resumeData: { name: 'John Doe', skills: ['Python', 'React'] },
        jdData: { job_title: 'Senior Engineer', company_name: 'TechCo' },
        resumeId: 'res-123',
        tailorResult: {
          ats_score: 85,
          job_match_percent: 72,
          strengths: ['Strong Python skills', 'Good React experience'],
          weaknesses: ['Missing Docker', 'No CI/CD experience'],
          missing_skills: ['Docker', 'Kubernetes'],
          missing_keywords: ['CI/CD', 'microservices'],
          suggestions: [
            { original_line: 'Built some apps', improved_line: 'Architected scalable web applications serving 10K+ users', reason: 'More impactful' },
          ],
          optimized_resume: { name: 'John Doe', skills: ['Python', 'React'] },
        },
        setTailorResult: vi.fn(),
      }),
    }))
  })

  it('shows score rings', async () => {
    const { default: TailorPage } = await import('../pages/TailorPage')
    render(
      <BrowserRouter>
        <TailorPage />
      </BrowserRouter>
    )
    expect(screen.getByText('ATS Score')).toBeDefined()
    expect(screen.getByText('Job Match')).toBeDefined()
  })

  it('shows strengths and weaknesses', async () => {
    const { default: TailorPage } = await import('../pages/TailorPage')
    render(
      <BrowserRouter>
        <TailorPage />
      </BrowserRouter>
    )
    expect(screen.getByText('Strong Python skills')).toBeDefined()
    expect(screen.getByText('Missing Docker')).toBeDefined()
  })

  it('shows missing skills and keywords', async () => {
    const { default: TailorPage } = await import('../pages/TailorPage')
    render(
      <BrowserRouter>
        <TailorPage />
      </BrowserRouter>
    )
    expect(screen.getByText('Docker')).toBeDefined()
    expect(screen.getByText('CI/CD')).toBeDefined()
  })

  it('shows suggestions with original and improved lines', async () => {
    const { default: TailorPage } = await import('../pages/TailorPage')
    render(
      <BrowserRouter>
        <TailorPage />
      </BrowserRouter>
    )
    expect(screen.getByText('Built some apps')).toBeDefined()
    expect(screen.getByText(/Architected scalable/)).toBeDefined()
    expect(screen.getByText('More impactful')).toBeDefined()
  })

  it('shows download and navigate buttons', async () => {
    const { default: TailorPage } = await import('../pages/TailorPage')
    render(
      <BrowserRouter>
        <TailorPage />
      </BrowserRouter>
    )
    expect(screen.getByText('📥 Download Optimized DOCX')).toBeDefined()
    expect(screen.getByText('🎤 Prepare for Interview →')).toBeDefined()
  })
})
