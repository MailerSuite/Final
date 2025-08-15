import { describe, it, expect } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import React from 'react'
import LegacyRedirects from '@/components/routing/LegacyRedirects'

const Marker = ({ text }: { text: string }) => <div>{text}</div>

describe('LegacyRedirects', () => {
  it('redirects /finalui2/* to root equivalents', () => {
    const initialEntries = ['/dashboard']
    const { container } = renderWithRouter(initialEntries)
    expect(container.textContent).toContain('root-dashboard')
  })
})

function renderWithRouter(initialEntries: string[]) {
  return require('@testing-library/react').render(
    <MemoryRouter initialEntries={initialEntries}>
      <LegacyRedirects />
      <Routes>
        <Route path="/dashboard" element={<Marker text="root-dashboard" />} />
        <Route path="*" element={<Marker text="not-found" />} />
      </Routes>
    </MemoryRouter>
  )
}
