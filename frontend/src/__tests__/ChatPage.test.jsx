import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import ChatPage from '../pages/ChatPage'

const mockStartSession = vi.fn()
const mockSendChat = vi.fn()

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    resumeData: { name: 'Test User', skills: ['Python'] },
    jdData: { job_title: 'Engineer', company_name: 'TestCo' },
    sessionId: 'sess-123',
    resumeId: 'res-123',
  }),
}))

vi.mock('../api/hiremind', () => ({
  startSession: (...args) => mockStartSession(...args),
  sendChat: (...args) => mockSendChat(...args),
}))

function renderChatPage() {
  return render(
    <BrowserRouter>
      <ChatPage />
    </BrowserRouter>
  )
}

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', () => {
    renderChatPage()
    expect(screen.getByText('💬 AI Career Coach')).toBeDefined()
  })

  it('shows session setup card initially', () => {
    renderChatPage()
    expect(screen.getByText('Start Your Coaching Session')).toBeDefined()
    expect(screen.getByText(/Test User/)).toBeDefined()
    expect(screen.getByText(/Engineer/)).toBeDefined()
  })

  it('shows focus area selector', () => {
    renderChatPage()
    expect(screen.getByText('Choose Your Focus Area')).toBeDefined()
    const select = screen.getByRole('combobox')
    expect(select).toBeDefined()
    expect(select.children.length).toBe(8) // 8 focus options
  })

  it('starts session when button clicked', async () => {
    mockStartSession.mockResolvedValue({ data: {} })

    renderChatPage()
    await userEvent.click(screen.getByText('🚀 Start Session'))

    await waitFor(() => {
      expect(mockStartSession).toHaveBeenCalledWith(
        'sess-123',
        'res-123',
        { name: 'Test User', skills: ['Python'] },
        { job_title: 'Engineer', company_name: 'TestCo' },
        'General Career Coaching'
      )
    })

    // Should show AI message
    expect(screen.getByText(/Hi Test User/)).toBeDefined()
  })

  it('shows error when session start fails', async () => {
    mockStartSession.mockRejectedValue({
      response: { data: { detail: 'Session failed' } },
    })

    renderChatPage()
    await userEvent.click(screen.getByText('🚀 Start Session'))

    await waitFor(() => {
      expect(screen.getByText('❌ Session failed')).toBeDefined()
    })
  })

  it('sends a chat message', async () => {
    mockStartSession.mockResolvedValue({ data: {} })
    mockSendChat.mockResolvedValue({
      data: { response: 'Great question! Here is my advice...' },
    })

    renderChatPage()
    await userEvent.click(screen.getByText('🚀 Start Session'))

    await waitFor(() => {
      expect(screen.getByText(/Hi Test User/)).toBeDefined()
    })

    const textarea = screen.getByPlaceholderText('Ask anything about your interview prep...')
    await userEvent.type(textarea, 'What is Python?')
    await userEvent.click(screen.getByText('Send ↗'))

    await waitFor(() => {
      expect(mockSendChat).toHaveBeenCalledWith('sess-123', 'What is Python?')
    })

    expect(screen.getByText('Great question! Here is my advice...')).toBeDefined()
  })

  it('shows error message when chat fails', async () => {
    mockStartSession.mockResolvedValue({ data: {} })
    mockSendChat.mockRejectedValue(new Error('Network Error'))

    renderChatPage()
    await userEvent.click(screen.getByText('🚀 Start Session'))

    await waitFor(() => {
      expect(screen.getByText(/Hi Test User/)).toBeDefined()
    })

    const textarea = screen.getByPlaceholderText('Ask anything about your interview prep...')
    await userEvent.type(textarea, 'Hello')
    // Get the send button by its actual text content
    const sendButtons = screen.getAllByText('Send ↗')
    await userEvent.click(sendButtons[sendButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByText('❌ Sorry, something went wrong. Please try again.')).toBeDefined()
    })
  })

  it('shows empty state when no resume/JD data', () => {
    vi.resetAllMocks()
    vi.mock('../context/AppContext', () => ({
      useApp: () => ({
        resumeData: null,
        jdData: null,
      }),
    }))

    // Need to re-render with mocked context
    renderChatPage()
    expect(screen.getByText('AI Coach Not Ready')).toBeDefined()
  })
})
