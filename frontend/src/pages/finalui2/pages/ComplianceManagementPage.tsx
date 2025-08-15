import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSessionId } from '@/utils/getSessionId'
import { bounceApi } from '@/api/bounce-api'
import PageShell from '../components/PageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, Input, Label, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Switch, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, Progress } from '@/components/ui/index'
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  UserMinusIcon, 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  TrashIcon, 
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { toast } from '@/hooks/useToast'

interface SuppressionEntry {
  email_address: string
  suppression_type: 'bounce' | 'unsubscribe' | 'complaint' | 'manual' | 'gdpr'
  reason?: string
  created_at: string
  expires_at?: string
  source: string
}

interface UnsubscribePreference {
  email: string
  categories: string[]
  frequency: 'never' | 'weekly' | 'monthly'
  last_updated: string
  ip_address: string
}

interface GDPRRequest {
  id: string
  email: string
  request_type: 'access' | 'deletion' | 'rectification' | 'portability'
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  created_at: string
  completed_at?: string
  notes?: string
}

const ComplianceManagementPage: React.FC = () => {
  const sessionId = getSessionId()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('suppression')
  const [showAddSuppression, setShowAddSuppression] = useState(false)
  const [showUnsubscribeCenter, setShowUnsubscribeCenter] = useState(false)
  const [showGdprRequest, setShowGdprRequest] = useState(false)
  
  const [newSuppression, setNewSuppression] = useState({
    email: '',
    type: 'manual' as const,
    reason: '',
    expiresIn: 0
  })
  
  const [unsubscribePreferences, setUnsubscribePreferences] = useState<UnsubscribePreference>({
    email: '',
    categories: [],
    frequency: 'monthly',
    last_updated: new Date().toISOString(),
    ip_address: '127.0.0.1'
  })
  
  const [gdprRequest, setGdprRequest] = useState({
    email: '',
    type: 'access' as const,
    notes: ''
  })

  // Fetch suppression list
  const { data: suppressionList, isLoading: loadingSuppression } = useQuery({
    queryKey: ['suppression-list', sessionId],
    queryFn: () => bounceApi.getSuppressionList({ limit: 1000 }),
    enabled: !!sessionId
  })

  // Fetch GDPR requests
  const { data: gdprRequests, isLoading: loadingGdpr } = useQuery({
    queryKey: ['gdpr-requests', sessionId],
    queryFn: async () => {
      if (!sessionId) return []
      const response = await fetch(`/api/compliance/gdpr-requests?session_id=${sessionId}`)
      return response.json()
    },
    enabled: !!sessionId
  })

  // Add suppression entry
  const addSuppressionMutation = useMutation({
    mutationFn: async (data: typeof newSuppression) => {
      if (!sessionId) throw new Error('No active session')
      const response = await fetch(`/api/compliance/suppression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          email: data.email,
          type: data.type,
          reason: data.reason,
          expires_in: data.expiresIn
        })
      })
      if (!response.ok) throw new Error('Failed to add suppression entry')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppression-list', sessionId] })
      setShowAddSuppression(false)
      setNewSuppression({ email: '', type: 'manual', reason: '', expiresIn: 0 })
      toast.success?.('Suppression entry added successfully')
    },
    onError: (error: any) => {
      toast.error?.(error?.message || 'Failed to add suppression entry')
    }
  })

  // Remove suppression entry
  const removeSuppressionMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!sessionId) throw new Error('No active session')
      const response = await fetch(`/api/compliance/suppression/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      })
      if (!response.ok) throw new Error('Failed to remove suppression entry')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppression-list', sessionId] })
      toast.success?.('Suppression entry removed successfully')
    },
    onError: (error: any) => {
      toast.error?.(error?.message || 'Failed to remove suppression entry')
    }
  })

  // Create GDPR request
  const createGdprRequestMutation = useMutation({
    mutationFn: async (data: typeof gdprRequest) => {
      if (!sessionId) throw new Error('No active session')
      const response = await fetch(`/api/compliance/gdpr-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          email: data.email,
          request_type: data.type,
          notes: data.notes
        })
      })
      if (!response.ok) throw new Error('Failed to create GDPR request')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gdpr-requests', sessionId] })
      setShowGdprRequest(false)
      setGdprRequest({ email: '', type: 'access', notes: '' })
      toast.success?.('GDPR request created successfully')
    },
    onError: (error: any) => {
      toast.error?.(error?.message || 'Failed to create GDPR request')
    }
  })

  const handleAddSuppression = () => {
    if (!newSuppression.email) {
      toast.error?.('Please enter an email address')
      return
    }
    addSuppressionMutation.mutate(newSuppression)
  }

  const handleCreateGdprRequest = () => {
    if (!gdprRequest.email) {
      toast.error?.('Please enter an email address')
      return
    }
    createGdprRequestMutation.mutate(gdprRequest)
  }

  const exportSuppressionList = () => {
    if (!suppressionList?.entries) return
    
    const csvContent = [
      'Email,Type,Reason,Created At,Expires At,Source',
      ...suppressionList.entries.map(entry => 
        `${entry.email_address},${entry.suppression_type},${entry.reason || ''},${entry.created_at},${entry.expires_at || ''},${entry.source}`
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `suppression-list-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getSuppressionTypeColor = (type: string) => {
    switch (type) {
      case 'bounce': return 'destructive'
      case 'unsubscribe': return 'secondary'
      case 'complaint': return 'destructive'
      case 'manual': return 'outline'
      case 'gdpr': return 'default'
      default: return 'outline'
    }
  }

  const getGdprStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'processing': return 'default'
      case 'completed': return 'default'
      case 'rejected': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <PageShell 
      title="Compliance Management" 
      subtitle="GDPR compliance, suppression lists, and unsubscribe management"
      breadcrumbs={[
        { label: 'Home', href: '/' }, 
        { label: 'Compliance' }
      ]}
    >
      <div className="space-y-6">
        {/* Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suppressed</CardTitle>
              <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppressionList?.entries?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Emails in suppression list
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GDPR Requests</CardTitle>
              <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gdprRequests?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Pending requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98%</div>
              <Progress value={98} className="mt-2" />
              <p className="text-xs text-muted-foreground">
                GDPR compliance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Audit</CardTitle>
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2d</div>
              <p className="text-xs text-muted-foreground">
                Days ago
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="suppression">Suppression Lists</TabsTrigger>
            <TabsTrigger value="unsubscribe">Unsubscribe Center</TabsTrigger>
            <TabsTrigger value="gdpr">GDPR Management</TabsTrigger>
            <TabsTrigger value="settings">Compliance Settings</TabsTrigger>
          </TabsList>

          {/* Suppression Lists Tab */}
          <TabsContent value="suppression" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Email Suppression Management</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportSuppressionList}>
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={() => setShowAddSuppression(true)}>
                    <UserMinusIcon className="w-4 h-4 mr-2" />
                    Add Entry
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingSuppression ? (
                    <div className="text-center py-8">Loading suppression list...</div>
                  ) : (
                    <div className="space-y-2">
                      {suppressionList?.entries?.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
                              <UserMinusIcon className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium">{entry.email_address}</div>
                              <div className="text-sm text-muted-foreground">
                                {entry.reason || 'No reason specified'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge variant={getSuppressionTypeColor(entry.suppression_type)}>
                              {entry.suppression_type}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeSuppressionMutation.mutate(entry.email_address)}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Unsubscribe Center Tab */}
          <TabsContent value="unsubscribe" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Unsubscribe Preference Center</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Manage how users can unsubscribe and control their email preferences.
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Unsubscribe Link Text</Label>
                      <Input defaultValue="Unsubscribe" placeholder="Unsubscribe" />
                    </div>
                    <div>
                      <Label>Preference Center Link</Label>
                      <Input defaultValue="/preferences" placeholder="/preferences" />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Email Categories</Label>
                    <div className="space-y-2 mt-2">
                      {['Newsletters', 'Promotions', 'Product Updates', 'Company News'].map(category => (
                        <label key={category} className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="accent-primary" />
                          <span className="text-sm">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <Button variant="outline">
                    <EyeIcon className="w-4 h-4 mr-2" />
                    Preview Preference Center
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GDPR Management Tab */}
          <TabsContent value="gdpr" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>GDPR Data Requests</CardTitle>
                <Button onClick={() => setShowGdprRequest(true)}>
                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                  New Request
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingGdpr ? (
                    <div className="text-center py-8">Loading GDPR requests...</div>
                  ) : (
                    <div className="space-y-2">
                      {gdprRequests?.map((request: GDPRRequest) => (
                        <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                              <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{request.email}</div>
                              <div className="text-sm text-muted-foreground">
                                {request.request_type} request
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge variant={getGdprStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {new Date(request.created_at).toLocaleDateString()}
                            </div>
                            <Button variant="outline" size="sm">
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">GDPR Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable GDPR Compliance</Label>
                          <div className="text-sm text-muted-foreground">
                            Automatically handle data subject requests
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Data Retention Policy</Label>
                          <div className="text-sm text-muted-foreground">
                            Automatically delete data after specified period
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div>
                        <Label>Data Retention Period (days)</Label>
                        <Input type="number" defaultValue={730} min="1" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Email Compliance</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Require Double Opt-in</Label>
                          <div className="text-sm text-muted-foreground">
                            Send confirmation email before subscribing
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Include Physical Address</Label>
                          <div className="text-sm text-muted-foreground">
                            Required for CAN-SPAM compliance
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div>
                        <Label>Company Address</Label>
                        <Textarea 
                          defaultValue="123 Business St, City, State 12345" 
                          placeholder="Enter your company's physical address"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Save Compliance Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Suppression Dialog */}
        <Dialog open={showAddSuppression} onOpenChange={setShowAddSuppression}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Suppression Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={newSuppression.email}
                  onChange={(e) => setNewSuppression(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <Label>Suppression Type</Label>
                <Select value={newSuppression.type} onValueChange={(value: any) => setNewSuppression(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="bounce">Bounce</SelectItem>
                    <SelectItem value="unsubscribe">Unsubscribe</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                    <SelectItem value="gdpr">GDPR Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Reason (Optional)</Label>
                <Textarea
                  value={newSuppression.reason}
                  onChange={(e) => setNewSuppression(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason for suppression"
                />
              </div>
              
              <div>
                <Label>Expires In (days, 0 = never)</Label>
                <Input
                  type="number"
                  value={newSuppression.expiresIn}
                  onChange={(e) => setNewSuppression(prev => ({ ...prev, expiresIn: Number(e.target.value) }))}
                  min="0"
                  placeholder="0"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddSuppression(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSuppression} disabled={addSuppressionMutation.isPending}>
                  {addSuppressionMutation.isPending ? 'Adding...' : 'Add Entry'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create GDPR Request Dialog */}
        <Dialog open={showGdprRequest} onOpenChange={setShowGdprRequest}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create GDPR Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={gdprRequest.email}
                  onChange={(e) => setGdprRequest(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <Label>Request Type</Label>
                <Select value={gdprRequest.type} onValueChange={(value: any) => setGdprRequest(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="access">Data Access Request</SelectItem>
                    <SelectItem value="deletion">Data Deletion Request</SelectItem>
                    <SelectItem value="rectification">Data Rectification Request</SelectItem>
                    <SelectItem value="portability">Data Portability Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={gdprRequest.notes}
                  onChange={(e) => setGdprRequest(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about the request"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowGdprRequest(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGdprRequest} disabled={createGdprRequestMutation.isPending}>
                  {createGdprRequestMutation.isPending ? 'Creating...' : 'Create Request'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  )
}

export default ComplianceManagementPage 