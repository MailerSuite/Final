import { useState } from 'react'
import { Button } from '@/components/ui/button'
import LetterOptions from './LetterOptions'

export default function TemplatePanel() {
  const [showLetters, setShowLetters] = useState(false)
  return (
    <div className="space-y-4">
      <Button onClick={() => setShowLetters((v) => !v)}>Randomize letters</Button>
      {showLetters && <LetterOptions />}
    </div>
  )
}
