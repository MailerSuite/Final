import { describe, it, expect } from 'vitest'
import { renderWithRouter as render, screen, fireEvent } from '@/test-utils'
import SMTPCheckerPage from '@/pages/finalui2/pages/SMTPCheckerPage'

describe('SMTPCheckerPage', () => {
  it('renders and allows entering server on Connection tab', async () => {
    render(<SMTPCheckerPage initialTab="connection" />)
    expect(await screen.findByText(/SMTP Configuration Tester/i)).toBeInTheDocument()
    const server = await screen.findByLabelText(/SMTP Server/i)
    fireEvent.change(server, { target: { value: 'smtp.example.com' } })
    expect(server).toHaveValue('smtp.example.com')
  })
})
