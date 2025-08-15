import { testA11y } from '@/test/a11y'
import { Button } from '../button'

describe('Button Accessibility', () => {
  it('has no a11y violations', async () => {
    await testA11y(<Button>Click me</Button>)
  })
  
  it('has proper ARIA attributes when disabled', async () => {
    await testA11y(<Button disabled>Disabled Button</Button>)
  })

  it('has proper ARIA attributes when loading', async () => {
    await testA11y(<Button disabled aria-disabled="true">Loading Button</Button>)
  })

  it('has proper role and type attributes', async () => {
    await testA11y(<Button type="submit">Submit Button</Button>)
  })
}) 