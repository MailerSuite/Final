import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import type { CampaignCreate } from '@/types/campaign'

interface Option {
  id: string
  name: string
}

interface StepRecipientsProps {
  form: CampaignCreate
  leadBases: Option[]
  onChange: (values: Partial<CampaignCreate>) => void
}

export default function StepRecipients({ form, leadBases, onChange }: StepRecipientsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Lead Bases<span className="text-destructive ml-1">*</span></Label>
        <MultiSelect
          options={leadBases.map((lb) => ({ value: lb.id, label: lb.name }))}
          selected={form.lead_base_ids}
          onChange={(vals: string[]) => onChange({ lead_base_ids: vals })}
          placeholder="Select lead bases"
        />
      </div>
    </div>
  )
}
