import { createContext, useContext } from 'react'
import type { ComposeDraft } from '@/types/mailer'
import useComposeDraft from '@/hooks/useComposeDraft'

interface ComposeContextValue {
  draft: ComposeDraft
  updateDraft: (data: Partial<ComposeDraft>) => void
  cancelSend: () => void
  registerCancel: (fn: () => void) => void
}

const ComposeCtx = createContext<ComposeContextValue | null>(null)

export function ComposeEmailProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useComposeDraft()
  const updateDraft = (data: Partial<ComposeDraft>) =>
    setDraft((prev) => ({ ...prev, ...data }))
  let cancelFn: () => void = () => {}
  const registerCancel = (fn: () => void) => {
    cancelFn = fn
  }
  const cancelSend = () => cancelFn()
  return (
    <ComposeCtx.Provider value={{ draft, updateDraft, cancelSend, registerCancel }}>
      {children}
    </ComposeCtx.Provider>
  )
}

export function useComposeEmail() {
  const ctx = useContext(ComposeCtx)
  if (!ctx) throw new Error('ComposeEmailProvider missing')
  return ctx
}
