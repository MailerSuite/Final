import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { MultiSelect } from '@/components/ui/multi-select'
import { Input } from '@/components/ui/input'
import useSessionStore from "@/store/session"
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { smtpApi, proxyApi } from '@/http/api'
import { Skeleton } from '@/components/ui/skeleton'
import SectionCard from '@/components/common/SectionCard'

interface Option { value: string; label: string }

export default function StepMailerConfig() {
  const { control, watch, setValue } = useFormContext()
  const [smtpOptions, setSmtpOptions] = useState<Option[]>([])
  const [proxyOptions, setProxyOptions] = useState<Option[]>([])
  const [loadingSmtp, setLoadingSmtp] = useState(true)
  const [loadingProxy, setLoadingProxy] = useState(true)
  const [errorSmtp, setErrorSmtp] = useState(false)
  const [errorProxy, setErrorProxy] = useState(false)

  const smtpAccounts: string[] = watch('smtpAccounts') || []
  const { session } = useSessionStore()

  useEffect(() => {
    const fetch = async () => {
      setLoadingSmtp(true)
      try {
        const { data } = await smtpApi.list(Number(session?.id) || 0)
        setSmtpOptions(data.map((s) => ({ value: String(s.id), label: s.email })))
        setErrorSmtp(false)
      } catch {
        setErrorSmtp(true)
      } finally {
        setLoadingSmtp(false)
      }
    }
    fetch()
  }, [])

  useEffect(() => {
    const fetch = async () => {
      setLoadingProxy(true)
      try {
        const { data } = await proxyApi.list(session?.id || '0')
        setProxyOptions(
          data.map((p) => ({ value: String(p.id), label: `${p.ip_address}:${p.port}` }))
        )
        setErrorProxy(false)
      } catch {
        setErrorProxy(true)
      } finally {
        setLoadingProxy(false)
      }
    }
    fetch()
  }, [])

  useEffect(() => {
    // reset retries and timeout to defaults when smtp selection changes
    setValue('retries', 3)
    setValue('timeout', 10000)
  }, [smtpAccounts, setValue])

  return (
    <SectionCard title="Mailer">
      <div className="space-y-6">
      <FormField
        control={control}
        name="smtpAccounts"
        rules={{ validate: (v: string[]) => (v?.length ? true : 'Select at least one SMTP account') }}
        render={({ field }: any) => (
          <FormItem>
            <FormLabel>SMTP Account(s)</FormLabel>
            <FormControl>
              {loadingSmtp ? (
                <Skeleton height={40} />
              ) : errorSmtp ? (
                <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              ) : (
                <MultiSelect options={smtpOptions} selected={field.value || []} onChange={field.onChange} />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="proxies"
        rules={{ validate: (v: string[]) => (v?.length ? true : 'Select at least one proxy') }}
        render={({ field }: any) => (
          <FormItem>
            <FormLabel>Proxy Server(s)</FormLabel>
            <FormControl>
              {loadingProxy ? (
                <Skeleton height={40} />
              ) : errorProxy ? (
                <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              ) : (
                <MultiSelect options={proxyOptions} selected={field.value || []} onChange={field.onChange} />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="retries"
        rules={{ min: 0, max: 10, valueAsNumber: true }}
        render={({ field }: any) => (
          <FormItem>
            <FormLabel>Retries</FormLabel>
            <FormControl>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input type="number" min={0} max={10} {...field} />
                </TooltipTrigger>
                <TooltipContent side="right">Number of retry attempts</TooltipContent>
              </Tooltip>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="timeout"
        rules={{ min: 1000, max: 60000, valueAsNumber: true }}
        render={({ field }: any) => (
          <FormItem>
            <FormLabel>Timeout (ms)</FormLabel>
            <FormControl>
              <Input type="number" min={1000} max={60000} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      </div>
    </SectionCard>
  )
}
