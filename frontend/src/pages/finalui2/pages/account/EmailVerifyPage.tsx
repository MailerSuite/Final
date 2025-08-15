import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import axios from '@/http/axios'

export default function EmailVerifyPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const verify = async () => {
    setLoading(true)
    try {
      await axios.post('/api/v1/auth/verify-email', { code })
      toast.success('Email verified')
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Verify Email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste code" />
            </div>
            <Button onClick={verify} disabled={loading || !code}>Verify</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
