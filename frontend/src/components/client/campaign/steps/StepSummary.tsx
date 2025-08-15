import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import SectionCard from '@/components/common/SectionCard'

interface Props {
  onEdit: (step: number) => void
}

export default function StepSummary({ onEdit }: Props) {
  const { getValues } = useFormContext()
  const v = getValues()
  return (
    <SectionCard title="Summary" className="p-4 text-sm">
      <div className="space-y-1">
        <div className="flex justify-between">
          <h3 className="font-semibold">Name & Materials</h3>
          <Button size="sm" variant="link" onClick={() => onEdit(0)}>
            Edit
          </Button>
        </div>
        <p>Name: {v.campaignName}</p>
        <p>Templates: {v.templateIds?.join(', ')}</p>
        <p>Senders: {v.senders?.join(', ')}</p>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <h3 className="font-semibold">Mailer</h3>
          <Button size="sm" variant="link" onClick={() => onEdit(1)}>
            Edit
          </Button>
        </div>
        <p>SMTP: {v.smtpAccounts?.length}</p>
        <p>Proxies: {v.proxies?.length}</p>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <h3 className="font-semibold">Scheduling</h3>
          <Button size="sm" variant="link" onClick={() => onEdit(2)}>
            Edit
          </Button>
        </div>
        <p>Batch: {v.batchSize}</p>
        <p>Delay: {v.delayValue}{v.delayUnit}</p>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <h3 className="font-semibold">Leads</h3>
          <Button size="sm" variant="link" onClick={() => onEdit(3)}>
            Edit
          </Button>
        </div>
        <p>Databases: {v.leadDatabases?.length}</p>
      </div>
    </SectionCard>
  )
}
