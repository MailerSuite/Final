import WizardStepper, { Step } from '@/components/common/WizardStepper'

interface Props {
  currentStep: number
  onStepChange: (step: number) => void
}

const steps: Step[] = [
  { id: 'basic', label: 'Basic', icon: null },
  { id: 'mailer', label: 'Mailer', icon: null },
  { id: 'schedule', label: 'Scheduling', icon: null },
  { id: 'leads', label: 'Leads', icon: null },
]

export default function CampaignStepper({ currentStep, onStepChange }: Props) {
  return (
    <WizardStepper
      steps={steps}
      current={currentStep - 1}
      onSelect={(i) => onStepChange(i + 1)}
      className="max-w-3xl mx-auto"
    />
  )
}
