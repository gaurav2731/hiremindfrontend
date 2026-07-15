import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import TailorPage from './TailorPage'
import * as AppContext from '../context/AppContext'

describe('TailorPage DOM Test', () => {
  it('renders missing data state when resumeData or jdData is missing', () => {
    vi.spyOn(AppContext, 'useApp').mockReturnValue({
      resumeData: null,
      jdData: null,
      resumeId: null,
      tailorResult: null,
      setTailorResult: vi.fn(),
    })

    render(
      <BrowserRouter>
        <TailorPage />
      </BrowserRouter>
    )

    expect(screen.getByText('Missing Data')).toBeInTheDocument()
    expect(screen.getByText('Upload Resume')).toBeInTheDocument()
    expect(screen.getByText('Add Job Description')).toBeInTheDocument()
  })

  it('renders ready state when data is present', () => {
    vi.spyOn(AppContext, 'useApp').mockReturnValue({
      resumeData: { name: 'John Doe', skills: ['React'] },
      jdData: { job_title: 'Frontend Engineer', company_name: 'Tech Inc' },
      resumeId: '123',
      tailorResult: null,
      setTailorResult: vi.fn(),
    })

    render(
      <BrowserRouter>
        <TailorPage />
      </BrowserRouter>
    )

    expect(screen.getByText('Ready to Optimize')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('✨ Tailor My Resume')).toBeInTheDocument()
  })
})
