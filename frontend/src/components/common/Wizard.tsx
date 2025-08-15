import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface WizardStep {
  title: string
  icon: React.ReactNode
}

interface WizardProps {
  steps: WizardStep[]
  currentStep: number
  onNext: () => void
  onBack: () => void
  disableNext?: boolean
  children: (step: number) => React.ReactNode
  className?: string
}

export default function Wizard({
  steps,
  currentStep,
  onNext,
  onBack,
  disableNext,
  children,
  className,
}: WizardProps) {
  return (
    <div className={cn('space-y-12', className)}>
      <ul className="flex justify-between items-center">
        {steps.map((step, i) => {
          const stepNo = i + 1
          const active = stepNo === currentStep
          return (
            <li key={step.title} className="flex flex-1 items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-medium',
                  active ? 'bg-destructive text-white' : 'bg-muted text-muted-foreground'
                )}
              >
                {stepNo}
              </div>
              <span
                className={cn(
                  'ml-2 text-sm flex items-center gap-1',
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.icon}
                {step.title}
              </span>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px bg-muted mx-2" />
              )}
            </li>
          )
        })}
      </ul>
      <div>{children(currentStep)}</div>
      <div className="flex justify-between">
        {currentStep > 1 ? (
          <Button size="sm" variant="secondary" onClick={onBack} type="button">
            Back
          </Button>
        ) : (
          <span />
        )}
        {currentStep < steps.length && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onNext}
            disabled={disableNext}
            type="button"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  )
}
