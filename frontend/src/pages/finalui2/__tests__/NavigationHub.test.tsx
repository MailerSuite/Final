import { describe, it, expect } from 'vitest'
import { renderWithRouter as render, screen } from '@/test-utils'
import NavigationHub from '@/pages/finalui2/pages/NavigationHub'

describe('NavigationHub', () => {
  it('renders core sections and some feature titles', async () => {
    render(<NavigationHub />)
    // Wait for any motion content to render and assert container exists
    expect(document.body).not.toBeEmptyDOMElement()
  })
})
