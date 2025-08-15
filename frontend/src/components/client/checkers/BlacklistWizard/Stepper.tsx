import WizardStepper, { Step } from '@/components/common/WizardStepper'
import { InputIcons, ResultsIcons } from './icons'

const steps: Step[] = [
  { id: 'input', label: 'Input', icon: <InputIcons.solid className="w-4 h-4" /> },
  { id: 'results', label: 'Results', icon: <ResultsIcons.solid className="w-4 h-4" /> },
]

export default function Stepper({ step, onChange, className }: { step: 0 | 1; onChange?: (s: 0 | 1) => void; className?: string }) {
  return (
    <WizardStepper
      steps={steps}
      current={step}
      onSelect={(i) => onChange?.(i as 0 | 1)}
      className={className}
    />
  )
}
