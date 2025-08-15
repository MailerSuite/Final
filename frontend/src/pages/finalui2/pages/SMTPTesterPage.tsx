import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { apiClient } from '@/http/stable-api-client'
import { toast } from 'sonner'
import PageShell from '../components/PageShell'

export default function SMTPTesterPage() {
  const [server, setServer] = useState('')
  const [port, setPort] = useState('587')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [useSsl, setUseSsl] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testSMTP = async () => {
    setLoading(true)
    setResult(null)
    try {
      // Prefer unified endpoint normalization
      const resp = await apiClient.post('/smtp/test', {
        server,
        port: Number(port),
        username,
        password,
        use_ssl: useSsl,
      })
      setResult(resp.data)
      toast.success(resp.message || 'SMTP test completed')
    } catch (e: any) {
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell
      title="SMTP Tester"
      subtitle="Run live connection tests, validate auth, and inspect capabilities"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Tools', href: '/smtp-checker' }, { label: 'SMTP Tester' }]}
      compact
    >
      <Card>
        <CardHeader>
          <CardTitle className="">Blazing‑Fast SMTP Checker</CardTitle>
          <CardDescription>Run live connection tests, validate auth, and inspect capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Server</Label>
              <Input value={server} onChange={e => setServer(e.target.value)} placeholder="smtp.example.com" />
            </div>
            <div>
              <Label>Port</Label>
              <Input value={port} onChange={e => setPort(e.target.value)} placeholder="587" />
            </div>
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="user@example.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="flex items-center gap-3">
              <Label>Use SSL/TLS</Label>
              <Switch checked={useSsl} onCheckedChange={setUseSsl} />
            </div>
          </div>
          <Button onClick={testSMTP} disabled={loading || !server}>
            {loading ? 'Testing…' : 'Test Connection'}
          </Button>
          {result && (
            <pre className="mt-4 p-3 bg-muted text-xs rounded border border-border overflow-auto max-h-80">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
