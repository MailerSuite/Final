import { useState, FormEvent } from 'react'
import Modal from '@/components/common/Modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import FormError from '@/components/common/FormError'

interface SessionCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string) => void
  existingNames: string[]
}

export default function SessionCreateModal({
  open,
  onOpenChange,
  onCreate,
  existingNames,
}: SessionCreateModalProps) {
  const [name, setName] = useState('')
  const [touched, setTouched] = useState(false)

  const nameExists = existingNames.some(
    (n) => n.toLowerCase() === name.trim().toLowerCase()
  )
  const lengthValid = name.trim().length >= 3 && name.trim().length <= 32
  const isValid = name.trim() !== '' && lengthValid && !nameExists

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!isValid) return
    onCreate(name.trim())
    setName('')
  }

  const errorMessage = () => {
    if (!touched) return null
    if (name.trim() === '') return 'Name is required'
    if (!lengthValid) return 'Name must be 3-32 characters'
    if (nameExists) return 'Name already exists'
    return null
  }

  return (
    <Modal
      title="Create Session"
      description="Choose a clear name so you can find this session later."
      icon={<PlusCircleIcon className="size-6" aria-hidden="true" />}
      isOpen={open}
      onClose={() => onOpenChange(false)}
      primaryLabel="Create Session"
      onPrimary={() => {
        setTouched(true)
        if (isValid) {
          onCreate(name.trim())
          setName('')
          onOpenChange(false)
        }
      }}
      secondaryLabel="Cancel"
      onSecondary={() => onOpenChange(false)}
    >
      <form
        id="create-session-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div className="space-y-2">
          <Label htmlFor="session-name">Session Name</Label>
          <Input
            id="session-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="e.g. Marketing Team"
            className={errorMessage() ? 'border-error' : ''}
          />
          <FormError message={errorMessage()} />
        </div>
      </form>
    </Modal>
  )
}
