import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useMemo } from 'react'
import SectionCard from '@/components/common/SectionCard'

export default function StepScheduling() {
  const { control, watch } = useFormContext()
  const batch = watch('batchSize') || 1
  const delayVal = watch('delayValue') || 0
  const delayUnit = watch('delayUnit') || 's'
  const leads = (watch('leadDatabases') || []).length * 1000

  const summary = useMemo(() => {
    const delaySec = delayUnit === 's' ? delayVal : delayVal * 60
    const batches = Math.ceil((leads || 0) / Math.max(batch, 1))
    const total = batches * delaySec
    const minutes = Math.floor(total / 60)
    const seconds = total % 60
    return `${batches * batch} mails in ${minutes}m ${seconds}s`
  }, [batch, delayVal, delayUnit, leads])

  return (
    <SectionCard title="Scheduling">
      <div className="space-y-6">
      <FormField
        control={control}
        name="batchSize"
        rules={{ required: true, min: 1, valueAsNumber: true }}
        render={({ field }: any) => (
          <FormItem>
            <FormLabel>Batch Size</FormLabel>
            <FormControl>
              <Input type="number" min={1} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-3 gap-2 items-end">
        <FormField
          control={control}
          name="delayValue"
          rules={{ required: true, min: 0, valueAsNumber: true }}
          render={({ field }: any) => (
            <FormItem className="col-span-2">
              <FormLabel>Delay Between Batches</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="delayUnit"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel className="sr-only">Unit</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="s">sec</SelectItem>
                    <SelectItem value="m">min</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <p className="text-sm text-muted-foreground">At {batch} per batch with {delayVal} {delayUnit} delay → {summary}</p>
      </div>
    </SectionCard>
  )
}
