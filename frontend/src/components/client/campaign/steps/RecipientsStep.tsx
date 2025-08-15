import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { Skeleton } from '@/components/ui/skeleton'
import type { CampaignCreate } from '@/types/campaign'

interface Option {
  id: string
  name: string
}

interface RecipientsStepProps {
  value: CampaignCreate
  leadBases: Option[]
  loading?: boolean
  onChange: (v: Partial<CampaignCreate>) => void
}

export default function RecipientsStep({ value, leadBases, loading, onChange }: RecipientsStepProps) {
  if (loading) {
    return <Skeleton height={40} />
  }
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Lead Bases<span className="text-destructive ml-1">*</span></Label>
        <MultiSelect
          options={leadBases.map(lb => ({ value: lb.id, label: lb.name }))}
          selected={value.lead_base_ids}
          onChange={(vals: string[]) => onChange({ lead_base_ids: vals })}
          placeholder="Select lead bases"
        />
      </div>
    </div>
  )
}
