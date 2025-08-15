import { Button } from '@/components/ui/button'
import type { CampaignCreate } from '@/types/campaign'

interface Option {
  id: string
  name: string
}

interface ReviewStepProps {
  value: CampaignCreate & { html: string }
  templates: Option[]
  leadBases: Option[]
  loading?: boolean
  onSubmit: () => void
  submitting: boolean
}

export default function ReviewStep({ value, templates, leadBases, onSubmit, submitting }: ReviewStepProps) {
  const templateName = templates.find(t => t.id === value.template_id)?.name
  const selectedBases = leadBases.filter(lb => value.lead_base_ids.includes(lb.id))
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Summary</h3>
        <pre className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">
{JSON.stringify({ ...value, template_name: templateName, lead_bases: selectedBases.map(b => b.name) }, null, 2)}
        </pre>
      </div>
      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Sending…' : 'Send campaign'}</Button>
      </div>
    </div>
  )
}
