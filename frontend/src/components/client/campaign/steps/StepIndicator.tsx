import clsx from 'clsx'

interface Props {
  index: number
  label: string
  active?: boolean
}

export default function StepIndicator({ index, label, active }: Props) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={clsx(
          'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium',
          active ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-300'
        )}
      >
        {index}
      </div>
      <span className={clsx('mt-1 text-xs', active ? 'text-red-400' : 'text-zinc-400')}>
        {label}
      </span>
    </div>
  )
}
