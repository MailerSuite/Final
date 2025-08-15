import { Button } from '@/components/ui/button'
import { Play, Square, Trash2 } from 'lucide-react'

interface Props {
  isRunning: boolean
  onStart: () => void
  onStop: () => void
  onClear: () => void
}

export default function ImapCheckerControls({
  isRunning,
  onStart,
  onStop,
  onClear,
}: Props) {
  return (
    <div className="flex gap-2 mt-2">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Start Test"
        onClick={onStart}
        disabled={isRunning}
      >
        <Play className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Stop Test"
        onClick={onStop}
        disabled={!isRunning}
      >
        <Square className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Clear Logs"
        onClick={onClear}
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  )
}
