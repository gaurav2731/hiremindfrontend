import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import DashboardPage from '../pages/Dashboard'

describe('DashboardPage - No Data', () => {
  beforeEach(() => {
    vi.mock('../context/AppContext', () => ({
      useApp: () => ({
        resumeData: null,
        jdData: null,
        tailorResult: null,
      }),
    }))
  })

  it('renders welcome message for new users', async () => {
    const { default: DashboardPage } = await import('../pages/Dashboard')
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )
    expect(screen.getByText('Welcome to HireMind AI 🧠')).toBeDefined()
  })

  it('renders all 5 steps', async () => {
    const { default: DashboardPage } = await import('../pages/Dashboard')
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )
    const steps = ['Upload Resume', 'Add Job Description', 'Tailor Resume', 'Interview Prep', 'AI Coach Chat']
    steps.forEach(s => {
      expect(screen.getByText(s)).toBeDefined()
    })
  })
})

describe('DashboardPage - With Data', () => {
  beforeEach(() => {
    vi.mock('../context/AppContext', () => ({
      useApp: () => ({
        resumeData: { name: 'John Doe', skills: ['Python', 'React'] },
        jdData: { job_title: 'Senior Engineer', company_name: 'TechCo' },
        tailorResult: {
          ats_score: 85,
          job_match_percent: 72,
          missing_skills: ['Docker'],
          suggestions: [{ original_line: 'old', improved_line: 'new', reason: 'better' }],
        },
      }),
    }))
  })

  it('renders welcome back message', async () => {
    const { default: DashboardPage } = await import('../pages/Dashboard')
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )
    expect(screen.getByText('Welcome back, John! 👋')).toBeDefined()
  })

  it('renders progress and stats', async () => {
    const { default: DashboardPage } = await import('../pages/Dashboard')
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )
    expect(screen.getByText('Session Progress')).toBeDefined()
    expect(screen.getByText('85')).toBeDefined() // ATS score
    expect(screen.getByText('72%')).toBeDefined()
  })

  it('renders quick actions', async () => {
    const { default: DashboardPage } = await import('../pages/Dashboard')
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )
    expect(screen.getByText('Upload Resume')).toBeDefined()
    expect(screen.getByText('Analyze Job Description')).toBeDefined()
    expect(screen.getByText('Tailor My Resume')).toBeDefined()
    expect(screen.getByText('Interview Questions')).toBeDefined()
  })

  it('shows completed steps', async () => {
    const { default: DashboardPage } = await import('../pages/Dashboard')
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )
    // Upload Resume and Add Job Description should be completed
    const upload = screen.getAllByText('Upload Resume')
    expect(upload.length).toBeGreaterThan(0)
    const interview = screen.getAllByText('Interview Prep')
    expect(interview.length).toBeGreaterThan(0)
  })
})
