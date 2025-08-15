import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

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
        <Icon name="Play" size="sm" ariaLabel="Start Test" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Stop Test"
        onClick={onStop}
        disabled={!isRunning}
      >
        <Icon name="Square" size="sm" ariaLabel="Stop Test" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Clear Logs"
        onClick={onClear}
      >
        <Icon name="Trash2" size="sm" className="text-destructive" ariaLabel="Clear Logs" />
      </Button>
    </div>
  )
}
