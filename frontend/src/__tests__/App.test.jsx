import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// Mock page components
vi.mock('../pages/Landing', () => ({
  default: () => <div data-testid="landing-page">Landing Page</div>,
}))

vi.mock('../pages/AuthPage', () => ({
  default: ({ onAuth }) => (
    <div data-testid="auth-page">
      Auth Page
      <button
        data-testid="mock-login"
        onClick={() => onAuth('fake-token', { id: 1, email: 'test@test.com', full_name: 'Test' })}
      >
        Login
      </button>
    </div>
  ),
}))

vi.mock('../pages/MainApp', () => ({
  default: () => <div data-testid="main-app">Main App</div>,
}))

describe('App Routing', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders landing page on root path', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByTestId('landing-page')).toBeDefined()
  })

  it('renders auth page on /auth', () => {
    window.history.pushState({}, '', '/auth')
    render(<App />)
    expect(screen.getByTestId('auth-page')).toBeDefined()
  })

  it('redirects to auth when accessing /app without token', () => {
    window.history.pushState({}, '', '/app')
    render(<App />)
    // Should redirect to /auth
    expect(screen.getByTestId('auth-page')).toBeDefined()
  })

  it('renders main app when token exists', () => {
    localStorage.setItem('access_token', 'valid-token')
    localStorage.setItem('hiremind_user', JSON.stringify({ id: 1, email: 'test@test.com' }))
    window.history.pushState({}, '', '/app')
    render(<App />)
    expect(screen.getByTestId('main-app')).toBeDefined()
  })

  it('redirects unknown routes to landing', () => {
    window.history.pushState({}, '', '/some-unknown-path')
    render(<App />)
    expect(screen.getByTestId('landing-page')).toBeDefined()
  })
})
