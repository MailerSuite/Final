import { useState, useEffect } from 'react'
import MultiSelectDropdown, { MultiSelectOption } from './MultiSelectDropdown'
import { proxyApi } from '@/http/api'
import useSessionStore from '@/store/session'
import type { ProxyServer } from '@/types/proxy'

interface ProxySelectorProps {
  value: string[]
  onChange: (value: string[]) => void
}

export default function ProxySelector({ value, onChange }: ProxySelectorProps) {
  const { session } = useSessionStore()
  const [options, setOptions] = useState<MultiSelectOption[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await proxyApi.list(session?.id || '0')
        setOptions(
          data.map((p: ProxyServer) => ({
            value: p.id,
            label: `${p.ip_address}:${p.port}`,
          }))
        )
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
      placeholder="Select proxy servers"
    />
  )
}
