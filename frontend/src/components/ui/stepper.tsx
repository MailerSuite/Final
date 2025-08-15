import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KeyboardEvent } from 'react'

export interface StepperProps {
  steps: string[]
  currentStep: number
  onStepChange?: (index: number) => void
  variant?: 'default' | 'error' | 'disabled'
  className?: string
}

export default function Stepper({
  steps,
  currentStep,
  onStepChange,
  variant = 'default',
  className,
}: StepperProps) {
  const getStepStatus = (step: number) =>
    currentStep > step ? 'completed' : currentStep === step ? 'active' : 'inactive'

  const getStepClasses = (step: number) => {
    const status = getStepStatus(step)
    if (status === 'completed') return 'bg-brand-green text-white'
    if (status === 'active')
      return 'bg-brand-gray-800 ring-2 ring-brand-red text-white'
    return 'bg-brand-gray-700 text-brand-gray-300'
  }

  const getTextClasses = (step: number) => {
    const status = getStepStatus(step)
    if (status === 'completed') return 'text-brand-green'
    if (status === 'active') return 'text-white'
    return 'text-brand-gray-300'
  }

  const getConnectorClasses = (index: number) => {
    if (index < currentStep - 1) return 'bg-brand-green'
    return 'bg-brand-gray-700'
  }

  const handleKey = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      onStepChange?.(Math.min(currentStep + 1, steps.length))
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onStepChange?.(Math.max(currentStep - 1, 1))
    }
  }

  return (
    <ul
      className={cn(
        'flex w-full justify-between sm:flex-row flex-col gap-4',
        className
      )}
      role="list"
      aria-label="Steps"
      tabIndex={0}
      onKeyDown={handleKey}
    >
      {steps.map((label, i) => {
        const step = i + 1
        return (
          <li key={label} className="flex flex-1 items-center" role="listitem">
            <button
              type="button"
              onClick={() => onStepChange?.(step)}
              className="flex flex-col items-center space-y-1 focus:outline-none flex-1"
              aria-current={step === currentStep ? 'step' : undefined}
            >
              <div
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center font-medium transition-all',
                  getStepClasses(step)
                )}
              >
                {getStepStatus(step) === 'completed' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step
                )}
              </div>
              <span className={cn('text-sm mt-2', getTextClasses(step))}>{label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={cn('hidden sm:block flex-1 h-px', getConnectorClasses(i))} />
            )}
          </li>
        )
      })}
    </ul>
  )
}
