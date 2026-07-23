import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import InterviewPage from '../pages/InterviewPage'

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    resumeData: { name: 'Test User', skills: ['Python'] },
    jdData: { job_title: 'Engineer', company_name: 'TestCo' },
    resumeId: 'res-123',
  }),
}))

vi.mock('../api/hiremind', () => ({
  generateQuestions: vi.fn(),
}))

import { generateQuestions } from '../api/hiremind'

function renderInterviewPage() {
  return render(
    <BrowserRouter>
      <InterviewPage />
    </BrowserRouter>
  )
}

describe('InterviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', () => {
    renderInterviewPage()
    expect(screen.getByText('🎤 Interview Prep')).toBeDefined()
  })

  it('renders all round types', () => {
    renderInterviewPage()
    const rounds = ['HR Round', 'Technical Round', 'Coding Round', 'System Design', 'Behavioral Round', 'Managerial Round']
    rounds.forEach(r => {
      expect(screen.getByText(r)).toBeDefined()
    })
  })

  it('calls generateQuestions when a round is clicked', async () => {
    generateQuestions.mockResolvedValue({
      data: {
        round_type: 'Technical',
        questions: [
          {
            question: 'What is Python?',
            difficulty: 'Easy',
            why_asked: 'To test basics',
            ideal_answer_hint: 'Explain clearly',
          },
        ],
        preparation_tips: ['Review fundamentals'],
        topics_to_revise: ['Python basics'],
      },
    })

    renderInterviewPage()
    await userEvent.click(screen.getByText('Technical Round'))

    await waitFor(() => {
      expect(generateQuestions).toHaveBeenCalledWith(
        'res-123',
        { name: 'Test User', skills: ['Python'] },
        { job_title: 'Engineer', company_name: 'TestCo' },
        'Technical',
        10
      )
    })

    expect(screen.getByText('Technical Round — 1 Questions')).toBeDefined()
    expect(screen.getByText('What is Python?')).toBeDefined()
  })

  it('shows error on generation failure', async () => {
    generateQuestions.mockRejectedValue({
      response: { data: { detail: 'Failed to generate' } },
    })

    renderInterviewPage()
    await userEvent.click(screen.getByText('Technical Round'))

    await waitFor(() => {
      expect(screen.getByText('❌ Failed to generate')).toBeDefined()
    })
  })

  it('expands and collapses question hints', async () => {
    generateQuestions.mockResolvedValue({
      data: {
        round_type: 'Technical',
        questions: [
          {
            question: 'What is Python?',
            difficulty: 'Easy',
            why_asked: 'To test basics',
            ideal_answer_hint: 'Explain clearly',
          },
        ],
      },
    })

    renderInterviewPage()
    await userEvent.click(screen.getByText('Technical Round'))

    await waitFor(() => {
      expect(screen.getByText('▼ Show answer hints')).toBeDefined()
    })

    await userEvent.click(screen.getByText('▼ Show answer hints'))
    expect(screen.getByText('▲ Hide hints')).toBeDefined()
    expect(screen.getByText(/Explain clearly/)).toBeDefined()
  })

  it('shows empty state when no resume/JD data', () => {
    vi.resetAllMocks()
    vi.mock('../context/AppContext', () => ({
      useApp: () => ({
        resumeData: null,
        jdData: null,
      }),
    }))

    renderInterviewPage()
    expect(screen.getByText('Setup Required')).toBeDefined()
  })
})
