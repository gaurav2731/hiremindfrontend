import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import ResumePage from '../pages/ResumePage'

// Mock the context
const mockSetResumeData = vi.fn()
const mockSetResumeId = vi.fn()

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    resumeData: null,
    setResumeData: mockSetResumeData,
    setResumeId: mockSetResumeId,
  }),
}))

vi.mock('../api/hiremind', () => ({
  uploadResume: vi.fn(),
}))

import { uploadResume } from '../api/hiremind'

function renderResumePage() {
  return render(
    <BrowserRouter>
      <ResumePage />
    </BrowserRouter>
  )
}

describe('ResumePage - Upload State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload zone', () => {
    renderResumePage()
    expect(screen.getByText('📄 Resume Upload')).toBeDefined()
    expect(screen.getByText('Drop your resume here')).toBeDefined()
    expect(screen.getByText('PDF or DOCX · Max 10MB')).toBeDefined()
  })

  it('renders choose file button', () => {
    renderResumePage()
    expect(screen.getByText('📤 Choose File')).toBeDefined()
  })

  it('shows error for invalid file type', async () => {
    renderResumePage()
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]')
    
    await userEvent.upload(input, file)
    
    expect(screen.getByText('❌ Only PDF or DOCX files are accepted.')).toBeDefined()
  })

  it('calls uploadResume for valid file type', async () => {
    uploadResume.mockResolvedValue({
      data: { name: 'Test User', skills: ['Python'], email: 'test@test.com' },
    })

    renderResumePage()
    const file = new File(['test'], 'resume.pdf', { type: 'application/pdf' })
    const input = document.querySelector('input[type="file"]')
    
    await userEvent.upload(input, file)
    
    await waitFor(() => {
      expect(uploadResume).toHaveBeenCalled()
    })
    expect(mockSetResumeData).toHaveBeenCalled()
  })

  it('shows parsing loading state', () => {
    uploadResume.mockImplementation(() => new Promise(() => {})) // Never resolves

    renderResumePage()
    const file = new File(['test'], 'resume.pdf', { type: 'application/pdf' })
    const input = document.querySelector('input[type="file"]')
    
    fireEvent.change(input, { target: { files: [file] } })
    
    expect(screen.getByText('Parsing...')).toBeDefined()
  })

  it('shows error message on upload failure', async () => {
    uploadResume.mockRejectedValue({
      response: { data: { detail: 'Failed to parse PDF' } },
    })

    renderResumePage()
    const file = new File(['test'], 'resume.pdf', { type: 'application/pdf' })
    const input = document.querySelector('input[type="file"]')
    
    await userEvent.upload(input, file)
    
    await waitFor(() => {
      expect(screen.getByText('❌ Failed to parse PDF')).toBeDefined()
    })
  })
})

describe('ResumePage - Parsed State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mock('../context/AppContext', () => ({
      useApp: () => ({
        resumeData: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-1234',
          summary: 'Experienced developer',
          skills: ['Python', 'React'],
          technologies: ['Docker', 'AWS'],
          experience: [
            {
              company: 'TechCorp',
              job_title: 'Senior Dev',
              start_date: '2020-01',
              end_date: 'Present',
              responsibilities: ['Built cool stuff'],
            },
          ],
          projects: [
            {
              name: 'Project X',
              description: 'A great project',
              technologies: ['React', 'Node'],
            },
          ],
        },
        setResumeData: vi.fn(),
        setResumeId: vi.fn(),
      }),
    }))
  })

  it('renders parsed resume data', async () => {
    const { default: ResumePage } = await import('../pages/ResumePage')
    render(
      <BrowserRouter>
        <ResumePage />
      </BrowserRouter>
    )

    expect(screen.getByText('✅ Resume parsed successfully!')).toBeDefined()
    expect(screen.getByText('John Doe')).toBeDefined()
    expect(screen.getByText(/john@example.com/)).toBeDefined()
    expect(screen.getByText('Senior Dev')).toBeDefined()
    expect(screen.getByText('TechCorp')).toBeDefined()
  })
})
