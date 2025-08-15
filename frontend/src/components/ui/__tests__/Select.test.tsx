import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@/test-utils'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../select'

function Demo() {
  return (
    <Select defaultOpen>
      <SelectTrigger aria-label="Port">
        <SelectValue placeholder="Choose a port" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="25">25</SelectItem>
        <SelectItem value="465">465</SelectItem>
        <SelectItem value="587">587</SelectItem>
      </SelectContent>
    </Select>
  )
}

describe('Select', () => {
  it('opens and allows selecting an option', async () => {
    render(<Demo />)
    const listbox = await screen.findByRole('listbox')
    // polyfill scrollIntoView used by Radix in tests
    ;(Element.prototype as any).scrollIntoView = (Element.prototype as any).scrollIntoView || (() => {})
    expect(within(listbox).getByText('587')).toBeInTheDocument()

    fireEvent.click(screen.getByText('587'))
    // Selected value should now be visible in trigger
    expect(screen.getByText('587')).toBeInTheDocument()
  })
})
