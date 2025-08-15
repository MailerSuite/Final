import RichTextEditor from '@/components/RichTextEditor'
import type { CampaignCreate } from '@/types/campaign'

interface ContentStepProps {
  html: string
  onChange: (v: { html: string }) => void
}

export default function ContentStep({ html, onChange }: ContentStepProps) {
  return (
    <div className="space-y-4">
      <RichTextEditor value={html} onChange={val => onChange({ html: val })} />
    </div>
  )
}
