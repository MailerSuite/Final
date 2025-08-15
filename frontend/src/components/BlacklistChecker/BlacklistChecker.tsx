import { useState } from 'react'
import BlacklistForm, { FormValues } from './BlacklistForm'
import ResultTable from './ResultTable'
import SummaryBar from './SummaryBar'
import { blacklistApi, BlacklistResponse } from '@/api/blacklist'
import { ProviderInfo } from './ProviderCheckboxGroup'

export const providers: ProviderInfo[] = [
  { id: 'spamhaus', name: 'Spamhaus', description: 'Spamhaus DNSBL' },
  { id: 'spamcop', name: 'SpamCop', description: 'SpamCop DNSBL' },
  { id: 'barracuda', name: 'Barracuda', description: 'Barracuda blacklist' },
  { id: 'sorbs', name: 'SORBS', description: 'SORBS blacklist' },
]

export default function BlacklistChecker() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BlacklistResponse | null>(null)

  const handleSubmit = async (values: FormValues) => {
    setLoading(true)
    const isIp = /\d+\.\d+\.\d+\.\d+/.test(values.value) || values.value.includes(':')
    const data = isIp
      ? await blacklistApi.checkIp(values.value, values.providers)
      : await blacklistApi.checkDomain(values.value, values.providers)
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BlacklistForm providers={providers} onSubmit={handleSubmit} loading={loading} />
      {result && (
        <>
          <SummaryBar results={result.results} />
          <ResultTable results={result.results} />
        </>
      )}
    </div>
  )
}
