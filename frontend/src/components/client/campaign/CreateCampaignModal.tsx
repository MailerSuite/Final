import CampaignWizardModal from './CampaignWizardModal'
import type { CampaignWizardValues } from './CampaignWizardModal'

interface CreateCampaignModalProps {
  open: boolean
  onClose: () => void
  onSave?: (data: CampaignWizardValues) => void
}

export default function CreateCampaignModal({ open, onClose, onSave }: CreateCampaignModalProps) {
  return <CampaignWizardModal isOpen={open} onClose={onClose} onSave={onSave} />
}
