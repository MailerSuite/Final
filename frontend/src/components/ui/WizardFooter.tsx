import { Button } from '@/components/ui/button'

type Props = {
  onBack: () => void
  onNext: () => void
  disableNext?: boolean
}

export function WizardFooter({ onBack, onNext, disableNext }: Props) {
  return (
    <div className="mt-10 flex items-center justify-between">
      <p className="text-xs text-zinc-500">
        All fields marked <span className="text-red-500">*</span> are required
      </p>
      <div className="space-x-2">
        <Button size="sm" variant="secondary" onClick={onBack} type="button">
          Back
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={disableNext}
          onClick={onNext}
          type="button"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
