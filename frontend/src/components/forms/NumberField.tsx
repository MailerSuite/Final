import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NumberFieldProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  required?: boolean
  error?: string
  className?: string
}

export default function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  required,
  error,
  className,
}: NumberFieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-400">*</span>}
      </Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        required={required}
        aria-invalid={!!error}
        className="w-full max-w-xs"
      />
      {error && <p className="text-destructive text-sm mt-1">{error}</p>}
    </div>
  )
}
