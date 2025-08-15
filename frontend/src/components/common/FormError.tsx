interface Props { message?: string | null }

export default function FormError({ message }: Props) {
  if (!message) return null
  return (
    <p role="alert" className="text-sm text-destructive mt-1">
      {message}
    </p>
  )
}
