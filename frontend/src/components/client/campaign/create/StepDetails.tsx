import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CampaignCreate } from '@/types/campaign'

interface Option {
  id: string
  name: string
}

interface StepDetailsProps {
  form: CampaignCreate
  templates: Option[]
  onChange: (values: Partial<CampaignCreate>) => void
}

export default function StepDetails({ form, templates, onChange }: StepDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Campaign Name<span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="template">Template<span className="text-destructive ml-1">*</span></Label>
        <Select value={form.template_id} onValueChange={(val) => onChange({ template_id: val })}>
          <SelectTrigger id="template" className="w-full">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((tpl) => (
              <SelectItem key={tpl.id} value={tpl.id}>
                {tpl.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={form.subject || ''}
          onChange={(e) => onChange({ subject: e.target.value })}
        />
      </div>
    </div>
  )
}
