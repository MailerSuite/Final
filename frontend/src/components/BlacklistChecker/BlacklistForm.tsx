import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { GlobeAltIcon } from '@heroicons/react/24/outline'
import ProviderCheckboxGroup, { ProviderInfo } from './ProviderCheckboxGroup'
import { isValidDomainOrIp } from '@/utils/validators'
import LoadingSpinner from '@/components/LoadingSpinner'
import React from 'react'

const schema = z.object({
  value: z.string().min(1).refine(isValidDomainOrIp, {
    message: 'Invalid domain or IP',
  }),
  providers: z.array(z.string()).min(1),
})

export type FormValues = z.infer<typeof schema>

interface Props {
  providers: ProviderInfo[]
  onSubmit(values: FormValues): void
  loading?: boolean
  formRef?: React.Ref<HTMLFormElement>
  onValidChange?: (valid: boolean) => void
}

export default function BlacklistForm({
  providers,
  onSubmit,
  loading,
  formRef,
  onValidChange,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { value: '', providers: providers.map(p => p.id) },
  })

  React.useEffect(() => {
    const sub = form.watch(() => {
      onValidChange?.(form.formState.isValid)
    })
    return () => sub.unsubscribe()
  }, [form, onValidChange])

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-md p-8 space-y-8">
      <Form {...form}>
        <form
          ref={formRef}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain or IP</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input placeholder="example.com" {...field} className="pl-8" />
                </FormControl>
                <GlobeAltIcon className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="providers"
          render={({ field }) => (
            <FormItem>
              <ProviderCheckboxGroup providers={providers} value={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={loading || !form.formState.isValid}
          className="relative"
        >
          {loading && (
            <LoadingSpinner className="absolute inset-0 m-auto w-4 h-4" />
          )}
          <span className={loading ? 'invisible' : ''}>Run Check</span>
        </Button>
      </form>
    </Form>
    </div>
  )
}
