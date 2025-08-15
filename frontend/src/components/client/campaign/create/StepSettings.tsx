import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CampaignCreate } from '@/types/campaign'

interface StepSettingsProps {
  form: CampaignCreate
  onChange: (values: Partial<CampaignCreate>) => void
}

export default function StepSettings({ form, onChange }: StepSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="batch_size">Batch Size</Label>
          <Input
            id="batch_size"
            type="number"
            min={1}
            max={1000}
            value={form.batch_size}
            onChange={(e) => onChange({ batch_size: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="delay_between_batches">Delay Between Batches (s)</Label>
          <Input
            id="delay_between_batches"
            type="number"
            min={1}
            max={3600}
            value={form.delay_between_batches}
            onChange={(e) =>
              onChange({ delay_between_batches: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="threads_count">Threads Count</Label>
          <Input
            id="threads_count"
            type="number"
            min={1}
            max={20}
            value={form.threads_count}
            onChange={(e) => onChange({ threads_count: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="autostart"
          checked={form.autostart}
          onCheckedChange={(c) => onChange({ autostart: !!c })}
        />
        <Label htmlFor="autostart">Autostart After Creation</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proxy_type">Proxy Type</Label>
        <Select
          value={form.proxy_type}
          onValueChange={(val) => onChange({ proxy_type: val as any })}
        >
          <SelectTrigger id="proxy_type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="http">HTTP</SelectItem>
            <SelectItem value="socks5">SOCKS5</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {form.proxy_type !== 'none' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="proxy_host">Proxy Host</Label>
            <Input
              id="proxy_host"
              value={form.proxy_host || ''}
              onChange={(e) => onChange({ proxy_host: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proxy_port">Proxy Port</Label>
            <Input
              id="proxy_port"
              type="number"
              value={form.proxy_port || ''}
              onChange={(e) => onChange({ proxy_port: Number(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
