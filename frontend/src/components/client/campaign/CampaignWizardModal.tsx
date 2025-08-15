import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { WizardHeader } from '@/components/ui/WizardHeader'
import { WizardFooter } from '@/components/ui/WizardFooter'
import CampaignStepper from './CampaignStepper'
import StepNameMaterials from './steps/StepNameMaterials'
import StepMailerConfig from './steps/StepMailerConfig'
import StepScheduling from './steps/StepScheduling'
import StepLeads from './steps/StepLeads'
import StepSummary from './steps/StepSummary'
import useCampaignStore from '@/store/campaign'

export interface CampaignWizardValues {
  campaignName: string
  templateIds: string[]
  senders: string[]
  sender?: string
  cc?: string[]
  bcc?: string[]
  messageType?: 'html'
  xHeaders: { key: string; value: string }[]
  smtpAccounts: string[]
  proxies: string[]
  retries: number
  timeout: number
  batchSize: number
  delayValue: number
  delayUnit: 's' | 'm'
  leadDatabases: string[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave?: (payload: CampaignWizardValues) => void
}

export default function CampaignWizardModal({ isOpen, onClose, onSave }: Props) {
  const { draft, updateDraft, clearDraft } = useCampaignStore()
  const methods = useForm<CampaignWizardValues>({
    defaultValues: {
      campaignName: draft.name,
      templateIds: draft.templateIds,
      senders: draft.senders,
      sender: draft.sender,
      cc: draft.cc,
      bcc: draft.bcc,
      messageType: 'html',
      xHeaders: draft.xHeaders,
      smtpAccounts: draft.smtpAccounts,
      proxies: draft.proxies,
      retries: draft.retries,
      timeout: draft.timeout,
      batchSize: draft.batchSize,
      delayValue: draft.delaySeconds,
      delayUnit: 's',
      leadDatabases: draft.leadDatabases,
    },
  })
  const { watch, getValues } = methods
  const [step, setStep] = useState(0)
  const titles = ['Name & Materials', 'Mailer', 'Scheduling', 'Leads']
  const steps = [
    <StepNameMaterials key="s1" />,
    <StepMailerConfig key="s2" />,
    <StepScheduling key="s3" />,
    <StepLeads key="s4" />,
    <StepSummary key="s5" onEdit={(i) => setStep(i)} />,
  ]

  function validate(index: number) {
    switch (index) {
      case 0:
        return watch('campaignName') && (watch('templateIds')?.length ?? 0) > 0
      case 1:
        return (watch('smtpAccounts')?.length ?? 0) > 0
      case 2:
        return watch('batchSize') >= 1
      case 3:
        return (watch('leadDatabases')?.length ?? 0) > 0
      default:
        return true
    }
  }

  // debounce save draft
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    const sub = watch(() => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const vals = getValues()
        updateDraft({
          name: vals.campaignName,
          templateIds: vals.templateIds,
          senders: vals.senders,
          sender: vals.sender,
          cc: vals.cc,
          bcc: vals.bcc,
          messageType: vals.messageType,
          xHeaders: vals.xHeaders,
          smtpAccounts: vals.smtpAccounts,
          proxies: vals.proxies,
          retries: vals.retries,
          timeout: vals.timeout,
          batchSize: vals.batchSize,
          delaySeconds: vals.delayValue,
          leadDatabases: vals.leadDatabases,
        })
      }, 500)
    })
    return () => {
      sub.unsubscribe()
      clearTimeout(timer)
    }
  }, [watch, getValues, updateDraft])

  function handleSave() {
    onSave?.(getValues())
    clearDraft()
    onClose()
  }

  const stepValid = validate(step)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="p-0 bg-transparent border-none shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Campaign Wizard</DialogTitle>
        </DialogHeader>
        <FormProvider {...methods}>
          <div className="rounded-lg ring-1 ring-zinc-700 bg-zinc-900/60 backdrop-blur p-8 w-[640px] max-h-[90vh] overflow-y-auto">
            <WizardHeader title={`Step ${step + 1}`} description={titles[Math.min(step, 3)]} />
            <CampaignStepper currentStep={step + 1} onStepChange={(s) => setStep(s - 1)} />
            {steps[step]}
            <div className="mt-6">
              <WizardFooter
                onBack={() => setStep((s) => s - 1)}
                onNext={() => (step < steps.length - 1 ? setStep((s) => s + 1) : handleSave())}
                disableNext={!stepValid}
              />
            </div>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
