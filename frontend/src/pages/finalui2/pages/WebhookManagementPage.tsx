import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Webhook, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  TestTube, 
  Copy, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  Filter,
  RefreshCw
} from 'lucide-react'
import { toast } from '@/hooks/useToast'
import PageShell from '../components/PageShell'
import WebhookForm from '@/components/webhooks/WebhookForm'

interface Webhook {
  id: string
  url: string
  events: string[]
  secret: string
  description?: string
  is_active: boolean
  retry_count: number
  timeout_seconds: number
  created_at: string
  updated_at: string
  last_triggered?: string
  success_rate?: number
  total_deliveries?: number
  failed_deliveries?: number
}

// Mock data - replace with actual API calls
const mockWebhooks: Webhook[] = [
  {
    id: '1',
    url: 'https://app.example.com/webhooks/campaigns',
    events: ['campaign.created', 'campaign.completed', 'email.sent'],
    secret: 'whsec_1234567890abcdef',
    description: 'Main application webhook for campaign events',
    is_active: true,
    retry_count: 3,
    timeout_seconds: 30,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
    last_triggered: '2024-01-20T14:25:00Z',
    success_rate: 98.5,
    total_deliveries: 1247,
    failed_deliveries: 18
  },
  {
    id: '2',
    url: 'https://analytics.example.com/sgpt-events',
    events: ['email.opened', 'email.clicked', 'email.bounced'],
    secret: 'whsec_abcdef1234567890',
    description: 'Analytics service webhook for email tracking',
    is_active: true,
    retry_count: 5,
    timeout_seconds: 15,
    created_at: '2024-01-10T08:30:00Z',
    updated_at: '2024-01-18T12:15:00Z',
    last_triggered: '2024-01-20T16:45:00Z',
    success_rate: 94.2,
    total_deliveries: 856,
    failed_deliveries: 52
  },
  {
    id: '3',
    url: 'https://crm.example.com/leads/webhook',
    events: ['lead.created', 'lead.updated'],
    secret: 'whsec_fedcba0987654321',
    description: 'CRM integration for lead management',
    is_active: false,
    retry_count: 2,
    timeout_seconds: 60,
    created_at: '2024-01-05T14:20:00Z',
    updated_at: '2024-01-19T09:45:00Z',
    last_triggered: '2024-01-19T09:30:00Z',
    success_rate: 76.3,
    total_deliveries: 342,
    failed_deliveries: 81
  }
]

export default function WebhookManagementPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>(mockWebhooks)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)

  const filteredWebhooks = webhooks.filter(webhook => {
    const matchesSearch = webhook.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         webhook.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && webhook.is_active) ||
                         (filterStatus === 'inactive' && !webhook.is_active)
    return matchesSearch && matchesStatus
  })

  const handleCreateWebhook = async (data: unknown) => {
    setLoading(true)
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newWebhook: Webhook = {
        id: Date.now().toString(),
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_deliveries: 0,
        failed_deliveries: 0,
        success_rate: 100
      }
      
      setWebhooks(prev => [...prev, newWebhook])
      setShowCreateModal(false)
      toast.success?.('Webhook created successfully')
    } catch (error) {
      toast.error?.('Failed to create webhook')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateWebhook = async (data: unknown) => {
    if (!editingWebhook) return
    
    setLoading(true)
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setWebhooks(prev => prev.map(webhook => 
        webhook.id === editingWebhook.id 
          ? { ...webhook, ...data, updated_at: new Date().toISOString() }
          : webhook
      ))
      setEditingWebhook(null)
      toast.success?.('Webhook updated successfully')
    } catch (error) {
      toast.error?.('Failed to update webhook')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      return
    }

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setWebhooks(prev => prev.filter(webhook => webhook.id !== webhookId))
      toast.success?.('Webhook deleted successfully')
    } catch (error) {
      toast.error?.('Failed to delete webhook')
    }
  }

  const handleTestWebhook = async (webhookId: string) => {
    setTestingWebhook(webhookId)
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const success = Math.random() > 0.2 // 80% success rate for demo
      if (success) {
        toast.success?.('Webhook test successful')
      } else {
        toast.error?.('Webhook test failed')
      }
    } catch (error) {
      toast.error?.('Webhook test failed')
    } finally {
      setTestingWebhook(null)
    }
  }

  const toggleWebhookStatus = async (webhookId: string) => {
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setWebhooks(prev => prev.map(webhook => 
        webhook.id === webhookId 
          ? { ...webhook, is_active: !webhook.is_active, updated_at: new Date().toISOString() }
          : webhook
      ))
      toast.success?.('Webhook status updated')
    } catch (error) {
      toast.error?.('Failed to update webhook status')
    }
  }

  const copyWebhookSecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    toast.success?.('Webhook secret copied to clipboard')
  }

  const getStatusBadge = (webhook: Webhook) => {
    if (!webhook.is_active) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    
    if (!webhook.success_rate) {
      return <Badge variant="outline">New</Badge>
    }
    
    if (webhook.success_rate >= 95) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Healthy</Badge>
    } else if (webhook.success_rate >= 80) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Error</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <PageShell
      title="Webhook Management"
      subtitle="Configure and manage webhook endpoints for event notifications"
      actions={
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Webhook
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Webhook className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Webhooks</p>
                  <p className="text-2xl font-bold">{webhooks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{webhooks.filter(w => w.is_active).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Success Rate</p>
                  <p className="text-2xl font-bold">
                    {webhooks.length > 0 
                      ? Math.round(webhooks.reduce((sum, w) => sum + (w.success_rate || 0), 0) / webhooks.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Deliveries</p>
                  <p className="text-2xl font-bold">
                    {webhooks.reduce((sum, w) => sum + (w.total_deliveries || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search webhooks by URL or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('active')}
                >
                  Active
                </Button>
                <Button
                  variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('inactive')}
                >
                  Inactive
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook Endpoints</CardTitle>
            <CardDescription>
              Manage your webhook endpoints and monitor their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredWebhooks.length === 0 ? (
              <div className="text-center py-12">
                <Webhook className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No webhooks found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'No webhooks match your current filters'
                    : 'Get started by creating your first webhook endpoint'
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create First Webhook
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Last Triggered</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWebhooks.map((webhook) => (
                      <TableRow key={webhook.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate max-w-[300px]" title={webhook.url}>
                                {webhook.url}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(webhook.url, '_blank')}
                                className="p-1 h-auto"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                            {webhook.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                                {webhook.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {webhook.events.slice(0, 2).map((event) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {event.split('.')[1]}
                              </Badge>
                            ))}
                            {webhook.events.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{webhook.events.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(webhook)}
                        </TableCell>
                        <TableCell>
                          {webhook.success_rate !== undefined ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {webhook.success_rate}%
                                </span>
                                {webhook.success_rate >= 95 ? (
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                ) : webhook.success_rate >= 80 ? (
                                  <AlertTriangle className="w-3 h-3 text-yellow-600" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-600" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {webhook.total_deliveries} deliveries
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No data</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {webhook.last_triggered ? (
                            <span className="text-sm">{formatDate(webhook.last_triggered)}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="p-2">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditingWebhook(webhook)}
                                className="gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleTestWebhook(webhook.id)}
                                disabled={testingWebhook === webhook.id}
                                className="gap-2"
                              >
                                {testingWebhook === webhook.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <TestTube className="w-4 h-4" />
                                )}
                                Test
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => copyWebhookSecret(webhook.secret)}
                                className="gap-2"
                              >
                                <Copy className="w-4 h-4" />
                                Copy Secret
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toggleWebhookStatus(webhook.id)}
                                className="gap-2"
                              >
                                {webhook.is_active ? (
                                  <>
                                    <XCircle className="w-4 h-4" />
                                    Disable
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    Enable
                                  </>
                                )}
                              </DropdownMenuItem>
                              <Separator className="my-1" />
                              <DropdownMenuItem
                                onClick={() => handleDeleteWebhook(webhook.id)}
                                className="gap-2 text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Webhook Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Webhook</DialogTitle>
          </DialogHeader>
          <WebhookForm
            onSubmit={handleCreateWebhook}
            onCancel={() => setShowCreateModal(false)}
            isLoading={loading}
            mode="create"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Webhook Modal */}
      <Dialog open={!!editingWebhook} onOpenChange={(open) => !open && setEditingWebhook(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
          </DialogHeader>
          {editingWebhook && (
            <WebhookForm
              webhook={editingWebhook}
              onSubmit={handleUpdateWebhook}
              onCancel={() => setEditingWebhook(null)}
              isLoading={loading}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}