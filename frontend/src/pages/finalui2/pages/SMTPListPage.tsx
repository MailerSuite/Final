import React from 'react';
import { getSessionId } from '@/utils/getSessionId';
import { useSmtpList, useDeleteSmtp, useCreateSmtp, useUpdateSmtp, bulkUploadSmtp } from '@/api/smtp';
import type { SMTPAccount } from '@/types/smtp';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
// Use ActionButton throughout instead of base Button
import { Input } from '@/components/ui/input';
import PageShell from '../components/PageShell';
import { Button } from '@/components/ui/button'
import { Cog6ToothIcon, PlayIcon, PlusIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline'
import MailLoader from '@/components/ui/MailLoader'
import { useNavigate } from 'react-router-dom'
// ui-kit ActionButton removed; using Button variants
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { smtpTestBatch } from '@/api/smtp'
// Error presentation moved to stable API client
// For now, using simple error handling
const presentErrorToUser = (error: any) => console.error('Error:', error);
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const Row: React.FC<{
  item: SMTPAccount;
  onDelete: (id: string) => void;
  onCheck: (item: SMTPAccount) => void;
  onUpdate: (id: string, payload: Partial<SMTPAccount>) => Promise<void>;
}> = ({ item, onDelete, onCheck, onUpdate }) => {
  const [isEditing, setIsEditing] = React.useState(false)
  const [email, setEmail] = React.useState(item.email)
  const [server, setServer] = React.useState(item.server)
  const [port, setPort] = React.useState<number | string>(item.port)
  const [password, setPassword] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  return (
    <TableRow>
      <TableCell className="py-3 px-4 min-w-56">
        {isEditing ? (
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        ) : (
          email
        )}
      </TableCell>
      <TableCell className="py-3 px-4 text-muted-foreground min-w-56">
        {isEditing ? (
          <div className="flex gap-2">
            <Input className="w-56" placeholder="smtp.server.com" value={server} onChange={(e) => setServer(e.target.value)} />
            <Input className="w-24" type="number" placeholder="587" value={port} onChange={(e) => setPort(e.target.value)} />
          </div>
        ) : (
          `${item.server}:${item.port}`
        )}
      </TableCell>
      <TableCell className="py-3 px-4">
        <span className="text-sm">
          {item.status}
        </span>
      </TableCell>
      <TableCell className="py-3 px-4 text-right">
        {isEditing ? (
          <div className="flex items-center justify-end gap-2">
            <Input className="w-48" type="password" placeholder="New password (optional)" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={async () => {
              try {
                setSaving(true)
                await onUpdate(item.id, { email, server, port: Number(port) || 587, ...(password ? { password } : {}) })
                setIsEditing(false)
              } finally { setSaving(false) }
            }} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        ) : (
          <>
            <Button size="sm" variant="outline" className="mr-2" onClick={() => onCheck(item)}><PlayIcon className="w-4 h-4 mr-1" />Check</Button>
            <Button size="sm" variant="outline" className="mr-2" onClick={() => setIsEditing(true)}>Edit</Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(item.id)}><TrashIcon className="w-4 h-4 mr-1" />Delete</Button>
          </>
        )}
      </TableCell>
    </TableRow>
  )
}

const SMTPListPage: React.FC = () => {
    const sessionId = getSessionId() || '';
    const navigate = useNavigate();
    const { data, isLoading, isError } = useSmtpList(sessionId);
    const { mutateAsync: deleteSmtp } = useDeleteSmtp(sessionId);
    const { mutateAsync: createSmtpMut } = useCreateSmtp(sessionId);
    const { mutateAsync: updateSmtpMut } = useUpdateSmtp(sessionId);
    const [newEmail, setNewEmail] = React.useState('');
    const [newServer, setNewServer] = React.useState('');
    const [newPort, setNewPort] = React.useState(587 as number | string);
    const [newPassword, setNewPassword] = React.useState('');
    const [newProvider, setNewProvider] = React.useState('custom');
    const [newOAuth, setNewOAuth] = React.useState(false);
    const [newWarmup, setNewWarmup] = React.useState(false);
    const [newWarmupRate, setNewWarmupRate] = React.useState(10);
    const [bulkData, setBulkData] = React.useState('');
    const [batchOpen, setBatchOpen] = React.useState(false)
    const [batchInput, setBatchInput] = React.useState('')
    const [batchTimeout, setBatchTimeout] = React.useState<number | string>(30_000)
    const [batchConcurrent, setBatchConcurrent] = React.useState<number | string>(10)
    const [batchRunning, setBatchRunning] = React.useState(false)
    const [oauthFlow, setOauthFlow] = React.useState<'idle' | 'authenticating' | 'success' | 'error'>('idle')
    const [oauthProvider, setOauthProvider] = React.useState<'gmail' | 'outlook' | 'yahoo' | 'custom'>('custom')
    const [oauthScopes, setOauthScopes] = React.useState<string[]>([])
    const [oauthRedirectUri, setOauthRedirectUri] = React.useState('')

    const handleCreateSmtp = async () => {
      if (!newEmail || !newServer || !newPassword) {
        toast.error?.('Please fill in all required fields')
        return
      }

      // Handle OAuth flow for supported providers
      if (newOAuth && oauthProvider !== 'custom') {
        try {
          setOauthFlow('authenticating')
          await initiateOAuthFlow(oauthProvider)
        } catch (error: any) {
          setOauthFlow('error')
          toast.error?.(error?.message || 'OAuth authentication failed')
        }
        return
      }

      try {
        await createSmtpMut({
          email: newEmail,
          server: newServer,
          port: Number(newPort) || 587,
          password: newPassword,
          provider: newProvider,
          oauth_enabled: newOAuth,
          warmup_enabled: newWarmup,
          warmup_rate: newWarmupRate
        } as any)
        setNewEmail('')
        setNewServer('')
        setNewPassword('')
        setNewPort('')
        setNewProvider('custom')
        setNewOAuth(false)
        setNewWarmup(false)
        setNewWarmupRate(10)
        toast.success?.('SMTP account created successfully')
      } catch (error: any) {
        toast.error?.(error?.message || 'Failed to create SMTP account')
      }
    }

    const initiateOAuthFlow = async (provider: 'gmail' | 'outlook' | 'yahoo') => {
      const sessionId = getSessionId()
      if (!sessionId) {
        throw new Error('No active session')
      }

      const oauthConfig = {
        gmail: {
          clientId: 'your-gmail-client-id',
          scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.compose'],
          authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
        },
        outlook: {
          clientId: 'your-outlook-client-id',
          scopes: ['https://graph.microsoft.com/Mail.Send', 'https://graph.microsoft.com/Mail.ReadWrite'],
          authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
        },
        yahoo: {
          clientId: 'your-yahoo-client-id',
          scopes: ['mail-w', 'mail-r'],
          authUrl: 'https://api.login.yahoo.com/oauth2/request_auth'
        }
      }

      const config = oauthConfig[provider]
      const redirectUri = `${window.location.origin}/oauth/callback`
      
      // Store OAuth state for security
      const state = Math.random().toString(36).substring(7)
      sessionStorage.setItem('oauth_state', state)
      sessionStorage.setItem('oauth_provider', provider)
      sessionStorage.setItem('oauth_session_id', sessionId)

      // Construct OAuth URL
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: config.scopes.join(' '),
        state: state,
        access_type: 'offline',
        prompt: 'consent'
      })

      // Open OAuth popup
      const popup = window.open(
        `${config.authUrl}?${params.toString()}`,
        'oauth_popup',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )

      // Listen for OAuth callback
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup)
          setOauthFlow('idle')
          // Check if we have the OAuth code
          const oauthCode = sessionStorage.getItem('oauth_code')
          if (oauthCode) {
            completeOAuthFlow(provider, oauthCode, sessionId)
            sessionStorage.removeItem('oauth_code')
          }
        }
      }, 1000)
    }

    const completeOAuthFlow = async (provider: string, code: string, sessionId: string) => {
      try {
        const response = await fetch('/api/oauth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            code,
            session_id: sessionId,
            redirect_uri: `${window.location.origin}/oauth/callback`
          })
        })

        if (!response.ok) {
          throw new Error('OAuth token exchange failed')
        }

        const { access_token, refresh_token, expires_in } = await response.json()
        
        // Create SMTP account with OAuth tokens
        await createSmtpMut({
           email: newEmail,
           server: newServer,
           port: Number(newPort) || 587,
           provider: oauthProvider,
           oauth_enabled: true,
           oauth_tokens: {
             access_token,
             refresh_token,
             expires_in,
             provider
           },
           warmup_enabled: newWarmup,
           warmup_rate: newWarmupRate
         } as any)

        setOauthFlow('success')
        toast.success?.(`${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth authentication successful!`)
        
        // Reset form
        setNewEmail('')
        setNewServer('')
        setNewPassword('')
        setNewPort('')
        setNewProvider('custom')
        setNewOAuth(false)
        setNewWarmup(false)
        setNewWarmupRate(10)
      } catch (error: any) {
        setOauthFlow('error')
        toast.error?.(error?.message || 'Failed to complete OAuth flow')
      }
    }

    return (
        <PageShell
            title="SMTP Accounts"
            subtitle="Manage and test outbound servers"
            actions={
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigate('/smtp/settings')}><Cog6ToothIcon className="w-4 h-4 mr-2" />Settings</Button>
                    <Button onClick={() => navigate('/smtp/checker?tab=connection')}><PlayIcon className="w-4 h-4 mr-2" />Open Checker</Button>
                </div>
            }
            toolbar={<div className="flex items-center gap-2"><Button variant="outline"><ArrowDownTrayIcon className="w-4 h-4 mr-2 rotate-180" />Import</Button><Button variant="outline"><ArrowDownTrayIcon className="w-4 h-4 mr-2" />Export</Button><Button variant="outline" onClick={() => setBatchOpen(true)}><PlayIcon className="w-4 h-4 mr-2" />Batch Test</Button></div>}
        >
            <Card variant="premium">
                <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>SMTP Batch Test</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">One per line: email:password@host:port</div>
                      <Textarea value={batchInput} onChange={(e) => setBatchInput(e.target.value)} placeholder="user@example.com:pass@smtp.example.com:587" className="min-h-40" />
                      <div className="premium-grid-2">
                        <Input type="number" value={batchTimeout} onChange={(e) => setBatchTimeout(e.target.value)} placeholder="Timeout ms" />
                        <Input type="number" value={batchConcurrent} onChange={(e) => setBatchConcurrent(e.target.value)} placeholder="Max concurrent" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setBatchOpen(false)}>Close</Button>
                        <Button onClick={async () => {
                          if (!batchInput.trim()) return
                          try {
                            setBatchRunning(true)
                            const lines = batchInput.split(/\n|\r/).map(s => s.trim()).filter(Boolean)
                            const accounts = lines.map((line) => {
                              // email:password@host:port
                              const [creds, hp] = line.split('@')
                              const [email, password] = creds.split(':')
                              const [server, portStr] = hp.split(':')
                              return { email, password, server, port: Number(portStr) || 587 }
                            }).filter(a => a.email && a.password && a.server)
                            await smtpTestBatch(accounts, { timeout: Number(batchTimeout) || 30000, max_concurrent: Number(batchConcurrent) || 10 })
                            toast.success?.('Batch test started')
                            setBatchOpen(false)
                          } catch (e: any) {
                            presentErrorToUser(e, 'Batch start failed')
                          } finally { setBatchRunning(false) }
                        }} disabled={batchRunning}>{batchRunning ? 'Starting…' : 'Start'}</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                {/* Quick Add */}
                <div className="premium-grid-5 mb-6">
                    <Input placeholder="email@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                    <Input placeholder="smtp.server.com" value={newServer} onChange={(e) => setNewServer(e.target.value)} />
                    <Input type="number" placeholder="587" value={newPort} onChange={(e) => setNewPort(e.target.value)} />
                    <Input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <Select value={newProvider} onValueChange={setNewProvider}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="gmail">Gmail</SelectItem>
                        <SelectItem value="outlook">Outlook</SelectItem>
                        <SelectItem value="yahoo">Yahoo</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={newOAuth} onCheckedChange={setNewOAuth} />
                      <Label>Enable OAuth</Label>
                    </div>

                    {newOAuth && (
                      <Card variant="elevated" className="space-y-4">
                        <div>
                          <Label>OAuth Provider</Label>
                          <Select value={oauthProvider} onValueChange={(value: any) => setOauthProvider(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gmail">Gmail (Google Workspace)</SelectItem>
                              <SelectItem value="outlook">Outlook (Microsoft 365)</SelectItem>
                              <SelectItem value="yahoo">Yahoo Mail</SelectItem>
                              <SelectItem value="custom">Custom OAuth</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {oauthProvider !== 'custom' && (
                          <div className="space-y-3">
                            <div className="text-sm text-muted-foreground">
                              <strong>{oauthProvider.charAt(0).toUpperCase() + oauthProvider.slice(1)} OAuth Setup:</strong>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              {oauthProvider === 'gmail' && (
                                <>
                                  <div>• Requires Google Cloud Console setup</div>
                                  <div>• Scopes: Gmail Send, Gmail Compose</div>
                                  <div>• Redirect URI: {window.location.origin}/oauth/callback</div>
                                </>
                              )}
                              {oauthProvider === 'outlook' && (
                                <>
                                  <div>• Requires Azure App Registration</div>
                                  <div>• Scopes: Mail.Send, Mail.ReadWrite</div>
                                  <div>• Redirect URI: {window.location.origin}/oauth/callback</div>
                                </>
                              )}
                              {oauthProvider === 'yahoo' && (
                                <>
                                  <div>• Requires Yahoo Developer Account</div>
                                  <div>• Scopes: mail-w, mail-r</div>
                                  <div>• Redirect URI: {window.location.origin}/oauth/callback</div>
                                </>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => initiateOAuthFlow(oauthProvider)}
                                disabled={oauthFlow === 'authenticating'}
                                className="w-full"
                              >
                                {oauthFlow === 'authenticating' ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Authenticating...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Authenticate with {oauthProvider.charAt(0).toUpperCase() + oauthProvider.slice(1)}
                                  </>
                                )}
                              </Button>
                            </div>

                            {oauthFlow === 'success' && (
                              <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                                ✅ OAuth authentication successful! You can now create the SMTP account.
                              </div>
                            )}

                            {oauthFlow === 'error' && (
                              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                ❌ OAuth authentication failed. Please try again or use password authentication.
                              </div>
                            )}
                          </div>
                        )}

                        {oauthProvider === 'custom' && (
                          <div className="space-y-3">
                            <div>
                              <Label>OAuth Scopes</Label>
                              <Input
                                value={oauthScopes.join(' ')}
                                onChange={(e) => setOauthScopes(e.target.value.split(' ').filter(Boolean))}
                                placeholder="e.g., mail.send mail.read"
                              />
                            </div>
                            <div>
                              <Label>Redirect URI</Label>
                              <Input
                                value={oauthRedirectUri}
                                onChange={(e) => setOauthRedirectUri(e.target.value)}
                                placeholder="https://yourdomain.com/oauth/callback"
                              />
                            </div>
                          </div>
                        )}
                      </Card>
                    )}
                    <Button onClick={handleCreateSmtp}>Add</Button>
                  </div>
                <div className="flex items-center gap-4 mb-6 text-sm">
                  <label className="flex items-center gap-2">
                    <Switch checked={newWarmup} onCheckedChange={setNewWarmup} />
                    <span>Enable Warmup</span>
                  </label>
                  {newWarmup && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Rate:</Label>
                      <Input 
                        type="number" 
                        className="w-20" 
                        value={newWarmupRate} 
                        onChange={(e) => setNewWarmupRate(Number(e.target.value) || 10)} 
                      />
                      <span className="text-xs text-muted-foreground">emails/day</span>
                    </div>
                  )}
                </div>
                {/* Bulk Upload */}
                <div className="mb-6">
                    <div className="text-sm text-muted-foreground mb-1">Bulk upload (email:password per line)</div>
                    <div className="flex gap-2">
                        <Input placeholder="user1:pass1\nuser2:pass2" value={bulkData} onChange={(e) => setBulkData(e.target.value)} />
                        <Button variant="outline" onClick={async () => {
                            if (!bulkData.trim()) return;
                            await bulkUploadSmtp(sessionId, bulkData.trim());
                            setBulkData('');
                        }}><ArrowDownTrayIcon className="w-4 h-4 mr-2 rotate-180" />Bulk Upload</Button>
                    </div>
                </div>
                {isLoading && (
                    <div className="py-8"><MailLoader size="md" /></div>
                )}
                {isError && <p className="text-destructive">Failed to load SMTP accounts</p>}
                {!isLoading && !isError && (
                    <div className="overflow-x-auto">
                        <Table className="w-full text-sm">
                            <TableHeader>
                                <TableRow className="text-left border-b border-white/10">
                                    <TableHead className="py-2 px-4">Email</TableHead>
                                    <TableHead className="py-2 px-4">Server</TableHead>
                                    <TableHead className="py-2 px-4">Status</TableHead>
                                    <TableHead className="py-2 px-4 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(data || []).map((item) => (
                                    <Row
                                        key={item.id}
                                        item={item}
                                        onDelete={(id) => deleteSmtp(id)}
                                        onCheck={(row) => navigate(`/smtp/checker?tab=connection&email=${encodeURIComponent(row.email)}&server=${encodeURIComponent(row.server)}&port=${row.port}`)}
                                        onUpdate={(id, payload) => updateSmtpMut({ id, payload })}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>
        </PageShell>
    );
};

export default SMTPListPage;

