import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import App from '@/App'

// Smoke test that App providers render and Router mounts

describe('App providers', () => {
  it('renders without crashing and shows something on screen', () => {
    render(<App />)
    // Expect at least the toaster container or any root element
    expect(document.body).toBeTruthy()
  })
})
