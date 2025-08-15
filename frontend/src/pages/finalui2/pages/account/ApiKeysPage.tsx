import React, { useState } from 'react'
import useSWR from 'swr'
import axios from '@/http/axios'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const fetcher = (url: string) => axios.get(url).then(r => r.data)

export default function ApiKeysPage() {
  const { data, mutate, isLoading } = useSWR('/api/v1/api-keys/', fetcher)
  const [name, setName] = useState('')
  const [newSecret, setNewSecret] = useState<string | null>(null)

  const createKey = async () => {
    try {
      const res = await axios.post('/api/v1/api-keys/', { name })
      setNewSecret(res.data?.secret)
      setName('')
      mutate()
    } catch (e: unknown) {
      toast.error(e?.response?.data?.detail ?? 'Failed to create API key')
    }
  }

  const deleteKey = async (id: string) => {
    try {
      await axios.delete(`/api/v1/api-keys/${id}`)
      toast.success('API key deleted')
      mutate()
    } catch (e: unknown) {
      toast.error(e?.response?.data?.detail ?? 'Failed to delete API key')
    }
  }

  const keys = Array.isArray(data) ? data : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input placeholder="Key name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
            <Button onClick={createKey} disabled={isLoading}>Create</Button>
          </div>
          {newSecret && (
            <div className="rounded border p-3 text-sm">
              <div className="font-medium">New key secret</div>
              <div className="text-muted-foreground">Copy and store it now. You won't be able to see it again.</div>
              <div className="mt-1 break-all text-foreground/90">{newSecret}</div>
            </div>
          )}
          <div className="space-y-2">
            {keys.length === 0 && <div className="text-sm text-muted-foreground">No API keys</div>}
            {keys.map((k: unknown) => (
              <div key={k.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <div className="font-medium">{k.name || 'Personal Token'}</div>
                  <div className="text-xs text-muted-foreground">{k.id}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => deleteKey(k.id)}>Delete</Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
