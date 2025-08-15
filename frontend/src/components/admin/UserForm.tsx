import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

export interface UserFormData {
  telegram_username: string
  email: string
  is_active: boolean
  is_admin: boolean
  expiry_date: string | null
}

interface UserFormProps {
  user?: UserFormData
  onSubmit: (data: UserFormData) => void
  onCancel: () => void
}

export default function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const { register, handleSubmit, reset } = useForm<UserFormData>({
    defaultValues: {
      telegram_username: user?.telegram_username ?? '',
      email: user?.email ?? '',
      is_active: user?.is_active ?? true,
      is_admin: user?.is_admin ?? false,
      expiry_date: user?.expiry_date ?? ''
    }
  })

  const submit = (data: UserFormData) => {
    onSubmit({ ...data, expiry_date: data.expiry_date || null })
    reset()
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Telegram Username</label>
        <input
          type="text"
          {...register('telegram_username')}
          className="form-input mt-1 block w-full"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          {...register('email')}
          className="form-input mt-1 block w-full"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="active" {...register('is_active')} />
        <label htmlFor="active" className="text-sm">Active</label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="admin" {...register('is_admin')} />
        <label htmlFor="admin" className="text-sm">Admin</label>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Expiry Date</label>
        <input
          type="date"
          {...register('expiry_date')}
          className="form-input mt-1 block w-full"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{user ? 'Save' : 'Create'}</Button>
      </div>
    </form>
  )
}
