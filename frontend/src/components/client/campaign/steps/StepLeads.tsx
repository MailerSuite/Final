import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { MultiSelect } from '@/components/ui/multi-select'
import { Button } from '@/components/ui/button'
import { leadBaseApi } from '@/http/api'
import { Skeleton } from '@/components/ui/skeleton'
import SectionCard from '@/components/common/SectionCard'

interface Option { value: string; label: string; count: number }

export default function StepLeads() {
  const { control } = useFormContext()
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await leadBaseApi.list('')
      const bases = (res.data as any).leads || (res.data as any).data?.leads || res.data
      setOptions(
        bases.map((d: any) => ({
          value: String(d.id),
          label: d.name,
          count: d.leads_count ?? 0,
        }))
      )
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <SectionCard title="Leads">
      <div className="space-y-6">
      <FormField
        control={control}
        name="leadDatabases"
        rules={{ validate: (v: string[]) => (v?.length ? true : 'Select at least one database') }}
        render={({ field }: any) => (
          <FormItem>
            <FormLabel>Databases</FormLabel>
            <FormControl>
              {loading ? (
                <Skeleton height={40} />
              ) : error ? (
                <Button size="sm" variant="outline" onClick={fetchData}>
                  Retry
                </Button>
              ) : (
                <MultiSelect
                  options={options.map((o) => ({ value: o.value, label: `${o.label} (${o.count})` }))}
                  selected={field.value || []}
                  onChange={field.onChange}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      </div>
    </SectionCard>
  )
}
