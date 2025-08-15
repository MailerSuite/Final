import { createContext, useContext, useState } from 'react'
import { blacklistApi, type BlacklistResponse } from '@/api/blacklist'
import type { FormValues } from '@/components/BlacklistChecker/BlacklistForm'

export type BlacklistPayload = FormValues

export interface WizardContext {
  step: 0 | 1
  setStep: (n: 0 | 1) => void
  data: BlacklistResponse | null
  runCheck: (payload: BlacklistPayload) => Promise<void>
}

const Ctx = createContext<WizardContext | null>(null)

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<0 | 1>(0)
  const [data, setData] = useState<BlacklistResponse | null>(null)
  const [payload, setPayload] = useState<BlacklistPayload | null>(null)

  const runCheck = async (vals: BlacklistPayload) => {
    if (
      payload &&
      payload.value === vals.value &&
      JSON.stringify(payload.providers) === JSON.stringify(vals.providers) &&
      data
    ) {
      setStep(1)
      return
    }
    setPayload(vals)
    const isIp = /\d+\.\d+\.\d+\.\d+/.test(vals.value) || vals.value.includes(':')
    const result = isIp
      ? await blacklistApi.checkIp(vals.value, vals.providers)
      : await blacklistApi.checkDomain(vals.value, vals.providers)
    setData(result)
    setStep(1)
  }

  return (
    <Ctx.Provider value={{ step, setStep, data, runCheck }}>{children}</Ctx.Provider>
  )
}

export function useBlacklistWizard() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('WizardProvider missing')
  return ctx
}
