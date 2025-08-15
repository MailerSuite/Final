import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { CampaignCreate } from '@/types/campaign'

interface Option {
  id: string
  name: string
}

interface DetailsStepProps {
  value: CampaignCreate
  templates: Option[]
  loading?: boolean
  onChange: (v: Partial<CampaignCreate>) => void
}

export default function DetailsStep({ value, templates, loading, onChange }: DetailsStepProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton height={40} />
        <Skeleton height={40} />
        <Skeleton height={40} />
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name<span className="text-destructive ml-1">*</span></Label>
        <Input id="name" value={value.name} onChange={e => onChange({ name: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="template">Template<span className="text-destructive ml-1">*</span></Label>
        <Select value={value.template_id} onValueChange={val => onChange({ template_id: val })}>
          <SelectTrigger id="template" className="w-full">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" value={value.subject ?? ''} onChange={e => onChange({ subject: e.target.value })} />
      </div>
    </div>
  )
}
