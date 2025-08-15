import { Button } from '@/components/ui/button'
import type { CampaignCreate } from '@/types/campaign'

interface Option {
  id: string
  name: string
}

interface StepReviewProps {
  form: CampaignCreate
  templates: Option[]
  leadBases: Option[]
  onSubmit: () => void
  loading: boolean
}

export default function StepReview({ form, templates, leadBases, onSubmit, loading }: StepReviewProps) {
  const templateName = templates.find((t) => t.id === form.template_id)?.name
  const selectedBases = leadBases.filter((lb) => form.lead_base_ids.includes(lb.id))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Summary</h3>
        <pre className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">
{JSON.stringify(
  {
    ...form,
    template_name: templateName,
    lead_bases: selectedBases.map((b) => b.name),
  },
  null,
  2
)}
        </pre>
      </div>
      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? 'Creating...' : 'Create Campaign'}
        </Button>
      </div>
    </div>
  )
}
