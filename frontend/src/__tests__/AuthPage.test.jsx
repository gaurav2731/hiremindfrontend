import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthPage from '../pages/AuthPage'

const mockOnAuth = vi.fn()

// Mock the API module
vi.mock('../api/hiremind', () => ({
  login: vi.fn(),
  register: vi.fn(),
}))

import { login as loginApi, register as registerApi } from '../api/hiremind'

function renderAuth() {
  return render(<AuthPage onAuth={mockOnAuth} />)
}

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders login form by default', () => {
    renderAuth()
    expect(screen.getByText('🔑 Sign In')).toBeDefined()
    expect(screen.getByPlaceholderText('you@example.com')).toBeDefined()
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined()
    // Full name should NOT be visible in login mode
    expect(screen.queryByPlaceholderText('Rahul Sharma')).toBeNull()
  })

  it('switches to register tab', async () => {
    renderAuth()
    await userEvent.click(screen.getByText('✨ Create Account'))
    expect(screen.getByPlaceholderText('Rahul Sharma')).toBeDefined()
    expect(screen.getByText('✨ Create Account')).toBeDefined()
  })

  it('shows error when registering without full name', async () => {
    renderAuth()
    await userEvent.click(screen.getByText('✨ Create Account'))
    await userEvent.click(screen.getByText('✨ Create Account'))
    expect(screen.getByText('Please enter your full name.')).toBeDefined()
  })

  it('calls login API on submit', async () => {
    loginApi.mockResolvedValue({
      data: { access_token: 'token-123', user: { id: 1, email: 'test@test.com' } },
    })

    renderAuth()
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await userEvent.click(screen.getByText('🚀 Sign In'))

    await waitFor(() => {
      expect(loginApi).toHaveBeenCalledWith('test@test.com', 'password123')
    })
    expect(mockOnAuth).toHaveBeenCalledWith('token-123', { id: 1, email: 'test@test.com' })
  })

  it('calls register API on submit', async () => {
    registerApi.mockResolvedValue({
      data: { access_token: 'token-456', user: { id: 2, email: 'new@test.com', full_name: 'New User' } },
    })

    renderAuth()
    await userEvent.click(screen.getByText('✨ Create Account'))

    await userEvent.type(screen.getByPlaceholderText('Rahul Sharma'), 'New User')
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'new@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await userEvent.click(screen.getByText('✨ Create Account'))

    await waitFor(() => {
      expect(registerApi).toHaveBeenCalledWith('new@test.com', 'password123', 'New User')
    })
    expect(mockOnAuth).toHaveBeenCalledWith('token-456', { id: 2, email: 'new@test.com', full_name: 'New User' })
  })

  it('displays error message on API failure', async () => {
    loginApi.mockRejectedValue({
      response: { data: { detail: 'Invalid credentials' } },
    })

    renderAuth()
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrong')
    await userEvent.click(screen.getByText('🚀 Sign In'))

    await waitFor(() => {
      expect(screen.getByText('❌ Invalid credentials')).toBeDefined()
    })
  })

  it('displays generic error when no detail provided', async () => {
    loginApi.mockRejectedValue(new Error('Network Error'))

    renderAuth()
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass')
    await userEvent.click(screen.getByText('🚀 Sign In'))

    await waitFor(() => {
      expect(screen.getByText('❌ Something went wrong. Please try again.')).toBeDefined()
    })
  })

  it('clears error when switching tabs', async () => {
    loginApi.mockRejectedValue({
      response: { data: { detail: 'Invalid credentials' } },
    })

    renderAuth()
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrong')
    await userEvent.click(screen.getByText('🚀 Sign In'))

    await waitFor(() => {
      expect(screen.getByText('❌ Invalid credentials')).toBeDefined()
    })

    // Switch to register tab
    await userEvent.click(screen.getByText('✨ Create Account'))
    expect(screen.queryByText('❌ Invalid credentials')).toBeNull()
  })

  it('shows loading state during submission', async () => {
    let resolvePromise
    loginApi.mockImplementation(() => new Promise(resolve => { resolvePromise = resolve }))

    renderAuth()
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass')
    await userEvent.click(screen.getByText('🚀 Sign In'))

    expect(screen.getByText('Signing in...')).toBeDefined()
    resolvePromise({ data: { access_token: 't', user: {} } })
  })
})
