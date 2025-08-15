import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import React from 'react'

export type Step = {
  id: string
  label: string
  icon: React.ReactNode
  done?: boolean
}

interface Props {
  steps: Step[]
  current: number
  onSelect?: (index: number) => void
  className?: string
}

export default function WizardStepper({ steps, current, onSelect, className }: Props) {
  const handleKey = (e: React.KeyboardEvent<HTMLOListElement>) => {
    if (e.key === 'ArrowRight') onSelect?.(Math.min(current + 1, steps.length - 1))
    if (e.key === 'ArrowLeft') onSelect?.(Math.max(current - 1, 0))
  }

  return (
    <ol
      className={cn('grid gap-4 sm:grid-cols-1', className)}
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      role="list"
      tabIndex={0}
      onKeyDown={handleKey}
    >
      {steps.map((step, i) => {
        const active = i === current
        const status = step.done ? 'done' : active ? 'active' : 'upcoming'
        return (
          <li key={step.id} className="flex items-center" role="listitem">
            <button
              type="button"
              onClick={() => onSelect?.(i)}
              className={cn(
                'flex flex-col items-center flex-1 focus:outline-none',
                active && 'font-medium'
              )}
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center mb-1',
                  status === 'done'
                    ? 'bg-primary text-primary-foreground'
                    : status === 'active'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {status === 'done' ? <Check className="w-4 h-4" /> : step.icon}
              </span>
              <span className="text-xs">{step.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className="hidden sm:block flex-1 h-px bg-border" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
