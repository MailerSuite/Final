import { HelpCircle } from 'lucide-react'

type Props = {
  title: string
  description: string
  onInfo?: () => void
}

export function WizardHeader({ title, description, onInfo }: Props) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
      {onInfo && (
        <button
          onClick={onInfo}
          className="text-zinc-400 hover:text-white transition-colors"
          aria-label="Information"
        >
                        <HelpCircle size={18} />
        </button>
      )}
    </div>
  )
}
