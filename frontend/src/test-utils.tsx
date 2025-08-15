import React, { PropsWithChildren } from 'react'
import { render as rtlRender } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@/components/providers/theme-provider'

function BaseProviders({ children }: PropsWithChildren) {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="opus-ui-theme">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export function render(ui: React.ReactElement, options?: Parameters<typeof rtlRender>[1]) {
  return rtlRender(ui, { wrapper: BaseProviders as React.ComponentType, ...options })
}

export function renderWithRouter(ui: React.ReactElement, initialEntries: string[] = ['/']) {
  return rtlRender(
    <MemoryRouter initialEntries={initialEntries}>
      <BaseProviders>{ui}</BaseProviders>
    </MemoryRouter>
  )
}

export * from '@testing-library/react'
