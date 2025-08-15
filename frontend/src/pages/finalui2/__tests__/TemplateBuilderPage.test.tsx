import { describe, it, expect } from 'vitest'
import { renderWithRouter as render, screen } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import TemplateBuilderEnhanced from '@/pages/finalui2/pages/TemplateBuilderEnhanced'

describe('TemplateBuilder', () => {
  it('renders header and preview elements', async () => {
    render(<TemplateBuilderEnhanced />)
    const headings = await screen.findAllByText(/Template Builder/i)
    expect(headings.length).toBeGreaterThan(0)

    // Switch to the Preview tab before asserting its content
    const previewTab = screen.getByRole('tab', { name: /Preview/i })
    await userEvent.click(previewTab)
    expect(await screen.findByText(/Template Preview/i)).toBeInTheDocument()
  })
})
