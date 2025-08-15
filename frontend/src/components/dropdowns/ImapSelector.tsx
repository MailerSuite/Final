import { useState, useEffect } from 'react'
import MultiSelectDropdown, { MultiSelectOption } from './MultiSelectDropdown'
import { imapApi } from '@/http/api'
import useSessionStore from '@/store/session'
import type { IMAPAccount } from '@/types/imap'

interface ImapSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
}

export default function ImapSelector({ value, onChange }: ImapSelectorProps) {
  const { session } = useSessionStore()
  const [options, setOptions] = useState<MultiSelectOption[]>([])
  const randomOption: MultiSelectOption = { value: 'random', label: 'Random IMAP' }

  useEffect(() => {
    if (!session?.id) {
      setOptions([randomOption])
      return
    }
    const fetchData = async () => {
      try {
        const { data } = await imapApi.list(session.id)
        const opts = data.map((i: IMAPAccount, idx: number) => ({
          value: i.id ?? `missing-${idx}`,
          label: i.email ?? '(missing data)',
        }))
        setOptions([randomOption, ...opts])
      } catch {
        setOptions([randomOption])
      }
    }
    fetchData()
  }, [session?.id])

  return (
    <MultiSelectDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Select IMAP accounts"
    />
  )
}
