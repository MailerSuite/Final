import { CheckStatus } from '@/types/checks'
import { cn } from '@/lib/utils'

interface CheckStatusPickerProps {
  currentStatus?: CheckStatus
  onChange: (status: CheckStatus) => void
  loading?: boolean
}

const OPTIONS: { label: string; value: CheckStatus }[] = [
  { label: 'Inbox', value: 'inbox' },
  { label: 'Junk', value: 'junk' },
  { label: 'Not arrived', value: 'not_arrived' },
]

export default function CheckStatusPicker({ currentStatus, onChange, loading }: CheckStatusPickerProps) {
  return (
    <div role="radiogroup" className="inline-flex gap-1">
      {OPTIONS.map((opt) => {
        const selected = currentStatus === opt.value
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={selected}
            disabled={loading}
            onClick={() => !loading && onChange(opt.value)}
            className={cn(
              'px-2 py-1 rounded text-xs border transition-colors',
              selected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground border-border dark:border-border hover:bg-muted/70',
              loading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
