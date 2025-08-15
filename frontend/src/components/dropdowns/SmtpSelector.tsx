import { useState, useEffect } from 'react'
import MultiSelectDropdown, { MultiSelectOption } from './MultiSelectDropdown'
import { listSmtp } from '@/api/smtp'
import useSessionStore from '@/store/session'
import type { SMTPAccount } from '@/types/smtp'

interface SmtpSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
}

export default function SmtpSelector({ value, onChange }: SmtpSelectorProps) {
  const { session } = useSessionStore()
  const [options, setOptions] = useState<MultiSelectOption[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await listSmtp(session?.id || '0')
        setOptions(data.map((s: SMTPAccount) => ({ value: s.id, label: s.email })))
      } catch {
        setOptions([])
      }
    }
    fetchData()
  }, [session?.id])

  return (
    <MultiSelectDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Select SMTP accounts"
    />
  )
}
