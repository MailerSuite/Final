import { useRef, useState } from 'react'
import BlacklistForm, { FormValues } from '@/components/BlacklistChecker/BlacklistForm'
import { providers } from '@/components/BlacklistChecker/BlacklistChecker'
import { useBlacklistWizard } from '@/hooks/useBlacklistWizard'

export default function InputStep() {
  const { runCheck } = useBlacklistWizard()
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (values: FormValues) => {
    setLoading(true)
    await runCheck(values)
    setLoading(false)
  }

  return (
    <BlacklistForm
      providers={providers}
      onSubmit={handleSubmit}
      loading={loading}
      formRef={formRef}
    />
  )
}
