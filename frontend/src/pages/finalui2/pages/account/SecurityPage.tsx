import React from 'react'
import PageShell from '../../components/PageShell'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import axios from '@/http/axios'

const schema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
})

type FormVals = z.infer<typeof schema>

export default function SecurityPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormVals>({ resolver: zodResolver(schema) })

  const onSubmit = async (vals: FormVals) => {
    try {
      await axios.put('/api/v1/auth/me/password', vals)
      toast.success('Password updated')
    } catch (e: unknown) {
      toast.error(e?.response?.data?.detail ?? 'Failed to update password')
    }
  }

  return (
    <PageShell
      title="Account Security"
      subtitle="Manage password and sensitive settings"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Account' }, { label: 'Security' }]}
      compact
    >
      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current password</Label>
                <Input id="current_password" type="password" {...register('current_password')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">New password</Label>
                <Input id="new_password" type="password" {...register('new_password')} />
              </div>
              <Button type="submit" disabled={isSubmitting}>Change password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
