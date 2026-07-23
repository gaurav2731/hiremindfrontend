import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AppProvider, useApp } from '../context/AppContext'

// Helper component to test context
function TestConsumer() {
  const ctx = useApp()
  return (
    <div>
      <div data-testid="resume-name">{ctx.resumeData?.name || 'no-resume'}</div>
      <div data-testid="jd-title">{ctx.jdData?.job_title || 'no-jd'}</div>
      <div data-testid="resume-id">{ctx.resumeId || 'no-id'}</div>
      <div data-testid="tailor-result">{ctx.tailorResult ? 'has-result' : 'no-result'}</div>
      <div data-testid="session-id">{ctx.sessionId || 'no-session'}</div>
      <button data-testid="set-resume" onClick={() => ctx.setResumeData({ name: 'Test User', skills: [] })}>
        Set Resume
      </button>
      <button data-testid="set-jd" onClick={() => ctx.setJdData({ job_title: 'Engineer' })}>
        Set JD
      </button>
      <button data-testid="reset" onClick={() => ctx.reset()}>
        Reset
      </button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <AppProvider>
      <TestConsumer />
    </AppProvider>
  )
}

describe('AppContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('provides initial null values', () => {
    renderWithProvider()
    expect(screen.getByTestId('resume-name').textContent).toBe('no-resume')
    expect(screen.getByTestId('jd-title').textContent).toBe('no-jd')
    expect(screen.getByTestId('resume-id').textContent).toBe('no-id')
    expect(screen.getByTestId('tailor-result').textContent).toBe('no-result')
    expect(screen.getByTestId('session-id').textContent).not.toBe('no-session')
  })

  it('generates a session ID on mount', () => {
    // Clear any existing session ID
    localStorage.removeItem('hiremind_session_id')
    renderWithProvider()
    const sessionId = screen.getByTestId('session-id').textContent
    expect(sessionId).toBeTruthy()
    expect(sessionId.length).toBeGreaterThan(0)
  })

  it('preserves existing session ID from localStorage', () => {
    localStorage.setItem('hiremind_session_id', 'pre-existing-session')
    renderWithProvider()
    expect(screen.getByTestId('session-id').textContent).toBe('pre-existing-session')
  })

  it('persists resume data to localStorage', () => {
    renderWithProvider()
    act(() => {
      screen.getByTestId('set-resume').click()
    })
    const stored = JSON.parse(localStorage.getItem('hiremind_resume'))
    expect(stored.name).toBe('Test User')
  })

  it('persists JD data to localStorage', () => {
    renderWithProvider()
    act(() => {
      screen.getByTestId('set-jd').click()
    })
    const stored = JSON.parse(localStorage.getItem('hiremind_jd'))
    expect(stored.job_title).toBe('Engineer')
  })

  it('reset clears data and localStorage', () => {
    renderWithProvider()
    act(() => {
      screen.getByTestId('set-resume').click()
      screen.getByTestId('set-jd').click()
    })
    expect(screen.getByTestId('resume-name').textContent).not.toBe('no-resume')

    act(() => {
      screen.getByTestId('reset').click()
    })
    expect(screen.getByTestId('resume-name').textContent).toBe('no-resume')
    expect(screen.getByTestId('jd-title').textContent).toBe('no-jd')
    expect(localStorage.getItem('hiremind_resume')).toBeNull()
    expect(localStorage.getItem('hiremind_jd')).toBeNull()
  })

  it('loads saved resume data from localStorage', () => {
    localStorage.setItem('hiremind_resume', JSON.stringify({ name: 'Saved User', skills: ['JS'] }))
    renderWithProvider()
    expect(screen.getByTestId('resume-name').textContent).toBe('Saved User')
  })

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('hiremind_resume', 'invalid-json!!!')
    renderWithProvider()
    expect(screen.getByTestId('resume-name').textContent).toBe('no-resume')
  })

  it('setResumeId persists to localStorage', () => {
    function TestResumeId() {
      const ctx = useApp()
      return (
        <>
          <div data-testid="rid">{ctx.resumeId || 'none'}</div>
          <button data-testid="set-rid" onClick={() => ctx.setResumeId('abc-123')}>Set</button>
        </>
      )
    }
    render(
      <AppProvider>
        <TestResumeId />
      </AppProvider>
    )
    act(() => { screen.getByTestId('set-rid').click() })
    expect(screen.getByTestId('rid').textContent).toBe('abc-123')
    expect(localStorage.getItem('hiremind_resume_id')).toBe('abc-123')
  })
})
