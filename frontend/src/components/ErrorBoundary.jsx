import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          padding: 24,
          color: 'var(--text-primary)',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>💥</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
              Oops! Something went wrong
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
              The app hit an unexpected error. Don't worry — your data is saved locally.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'var(--gradient-brand)', color: 'white', border: 'none',
                  borderRadius: 10, padding: '12px 24px', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                🔄 Reload App
              </button>
              <button
                onClick={() => {
                  localStorage.clear()
                  window.location.href = '/'
                }}
                style={{
                  background: 'transparent', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', borderRadius: 10,
                  padding: '12px 24px', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                🧹 Reset & Go Home
              </button>
            </div>
            {this.state.error && (
              <details style={{ marginTop: 24, textAlign: 'left' }}>
                <summary style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Error details
                </summary>
                <pre style={{
                  marginTop: 8, padding: 12, background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  fontSize: 11, color: '#f87171', overflowX: 'auto',
                  fontFamily: 'monospace',
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
