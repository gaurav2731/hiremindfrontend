import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Landing from '../pages/Landing'

function renderLanding() {
  return render(
    <BrowserRouter>
      <Landing />
    </BrowserRouter>
  )
}

describe('Landing Page', () => {
  it('renders hero section with title', () => {
    renderLanding()
    expect(screen.getByText('Your AI Career Agent')).toBeDefined()
    expect(screen.getByText(/That Actually Wins Jobs/)).toBeDefined()
  })

  it('renders hero action buttons linking to auth', () => {
    renderLanding()
    const startFreeLinks = screen.getAllByText('🚀 Start Free — Upload Resume')
    expect(startFreeLinks.length).toBeGreaterThan(0)
    startFreeLinks.forEach(link => {
      expect(link.closest('a').getAttribute('href')).toBe('/auth')
    })
  })

  it('renders the AI Coach link to auth', () => {
    renderLanding()
    const coachLinks = screen.getAllByText('💬 Try AI Coach')
    expect(coachLinks.length).toBeGreaterThan(0)
    coachLinks.forEach(link => {
      expect(link.closest('a').getAttribute('href')).toBe('/auth')
    })
  })

  it('renders all 6 feature cards', () => {
    renderLanding()
    const features = [
      'Smart Resume Parser',
      'ATS Score & Tailoring',
      'JD Analyzer',
      'Interview Question Generator',
      'AI Career Coach',
      'Skill Gap Analysis',
    ]
    features.forEach(f => {
      expect(screen.getByText(f)).toBeDefined()
    })
  })

  it('renders all 3 steps', () => {
    renderLanding()
    expect(screen.getByText('Upload Your Resume')).toBeDefined()
    expect(screen.getByText('Add Job Description')).toBeDefined()
    expect(screen.getByText('Prepare & Win')).toBeDefined()
  })

  it('renders stats section', () => {
    renderLanding()
    const stats = ['3x', '92%', '10+']
    stats.forEach(s => {
      expect(screen.getByText(s)).toBeDefined()
    })
  })

  it('renders CTA section with link to auth', () => {
    renderLanding()
    const ctaLinks = screen.getAllByText('🧠 Start Your AI Career Prep')
    expect(ctaLinks.length).toBeGreaterThan(0)
  })

  it('renders step numbers', () => {
    renderLanding()
    expect(screen.getByText('Step 1')).toBeDefined()
    expect(screen.getByText('Step 2')).toBeDefined()
    expect(screen.getByText('Step 3')).toBeDefined()
  })

  it('renders the powered by badge', () => {
    renderLanding()
    expect(screen.getByText(/Powered by GPT-4o/)).toBeDefined()
  })
})
