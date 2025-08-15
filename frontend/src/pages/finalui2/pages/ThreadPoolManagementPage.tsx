import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Cpu, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Activity, 
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Timer,
  TrendingUp,
  Users,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Link
} from 'lucide-react'
import { toast } from '@/hooks/useToast'
import PageShell from '../components/PageShell'
import ThreadPoolForm from '@/components/thread-pools/ThreadPoolForm'

interface ThreadPool {
  id: string
  name: string
  priority: 'high' | 'normal' | 'low'
  max_connections: number
  delay_ms: number
  enabled: boolean
  created_at: string
  updated_at: string
  // Runtime stats
  active_connections: number
  queued_tasks: number
  completed_tasks: number
  failed_tasks: number
  average_response_time: number
  uptime_percentage: number
  // Assignments
  assigned_smtp: number
  assigned_imap: number
  assigned_campaigns: number
}

// Mock data - replace with actual API calls
const mockThreadPools: ThreadPool[] = [
  {
    id: '1',
    name: 'High-Performance SMTP Pool',
    priority: 'high',
    max_connections: 50,
    delay_ms: 100,
    enabled: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
    active_connections: 23,
    queued_tasks: 145,
    completed_tasks: 5420,
    failed_tasks: 12,
    average_response_time: 85,
    uptime_percentage: 99.8,
    assigned_smtp: 15,
    assigned_imap: 3,
    assigned_campaigns: 8
  },
  {
    id: '2',
    name: 'Standard Email Pool',
    priority: 'normal',
    max_connections: 25,
    delay_ms: 500,
    enabled: true,
    created_at: '2024-01-10T08:30:00Z',
    updated_at: '2024-01-18T12:15:00Z',
    active_connections: 12,
    queued_tasks: 56,
    completed_tasks: 2840,
    failed_tasks: 8,
    average_response_time: 120,
    uptime_percentage: 98.5,
    assigned_smtp: 8,
    assigned_imap: 5,
    assigned_campaigns: 12
  },
  {
    id: '3',
    name: 'Background Processing Pool',
    priority: 'low',
    max_connections: 10,
    delay_ms: 2000,
    enabled: false,
    created_at: '2024-01-05T14:20:00Z',
    updated_at: '2024-01-19T09:45:00Z',
    active_connections: 0,
    queued_tasks: 0,
    completed_tasks: 850,
    failed_tasks: 25,
    average_response_time: 250,
    uptime_percentage: 95.2,
    assigned_smtp: 2,
    assigned_imap: 1,
    assigned_campaigns: 3
  }
]

export default function ThreadPoolManagementPage() {
  const [threadPools, setThreadPools] = useState<ThreadPool[]>(mockThreadPools)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'normal' | 'low'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPool, setEditingPool] = useState<ThreadPool | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningPool, setAssigningPool] = useState<ThreadPool | null>(null)

  const filteredPools = threadPools.filter(pool => {
    const matchesSearch = pool.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = filterPriority === 'all' || pool.priority === filterPriority
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'enabled' && pool.enabled) ||
                         (filterStatus === 'disabled' && !pool.enabled)
    return matchesSearch && matchesPriority && matchesStatus
  })

  const handleCreatePool = async (data: any) => {
    setLoading(true)
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newPool: ThreadPool = {
        id: Date.now().toString(),
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active_connections: 0,
        queued_tasks: 0,
        completed_tasks: 0,
        failed_tasks: 0,
        average_response_time: 0,
        uptime_percentage: 100,
        assigned_smtp: 0,
        assigned_imap: 0,
        assigned_campaigns: 0
      }
      
      setThreadPools(prev => [...prev, newPool])
      setShowCreateModal(false)
      toast.success?.('Thread pool created successfully')
    } catch (error) {
      toast.error?.('Failed to create thread pool')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePool = async (data: any) => {
    if (!editingPool) return
    
    setLoading(true)
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setThreadPools(prev => prev.map(pool => 
        pool.id === editingPool.id 
          ? { ...pool, ...data, updated_at: new Date().toISOString() }
          : pool
      ))
      setEditingPool(null)
      toast.success?.('Thread pool updated successfully')
    } catch (error) {
      toast.error?.('Failed to update thread pool')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePool = async (poolId: string) => {
    const pool = threadPools.find(p => p.id === poolId)
    const totalAssigned = (pool?.assigned_smtp || 0) + (pool?.assigned_imap || 0) + (pool?.assigned_campaigns || 0)
    
    if (totalAssigned > 0) {
      toast.error?.(`Cannot delete pool with ${totalAssigned} active assignments`)
      return
    }

    if (!confirm('Are you sure you want to delete this thread pool? This action cannot be undone.')) {
      return
    }

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setThreadPools(prev => prev.filter(pool => pool.id !== poolId))
      toast.success?.('Thread pool deleted successfully')
    } catch (error) {
      toast.error?.('Failed to delete thread pool')
    }
  }

  const togglePoolStatus = async (poolId: string) => {
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setThreadPools(prev => prev.map(pool => 
        pool.id === poolId 
          ? { ...pool, enabled: !pool.enabled, updated_at: new Date().toISOString() }
          : pool
      ))
      toast.success?.('Thread pool status updated')
    } catch (error) {
      toast.error?.('Failed to update thread pool status')
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>
      case 'normal':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Normal</Badge>
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getStatusBadge = (pool: ThreadPool) => {
    if (!pool.enabled) {
      return <Badge variant="secondary">Disabled</Badge>
    }
    
    if (pool.active_connections === 0) {
      return <Badge variant="outline">Idle</Badge>
    }
    
    const utilization = (pool.active_connections / pool.max_connections) * 100
    if (utilization > 80) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High Load</Badge>
    } else if (utilization > 50) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium Load</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
    }
  }

  const getUtilizationPercentage = (pool: ThreadPool) => {
    return pool.max_connections > 0 ? (pool.active_connections / pool.max_connections) * 100 : 0
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const totalStats = threadPools.reduce((acc, pool) => ({
    totalPools: acc.totalPools + 1,
    activePools: acc.activePools + (pool.enabled ? 1 : 0),
    totalConnections: acc.totalConnections + pool.active_connections,
    totalAssignments: acc.totalAssignments + pool.assigned_smtp + pool.assigned_imap + pool.assigned_campaigns,
  }), { totalPools: 0, activePools: 0, totalConnections: 0, totalAssignments: 0 })

  return (
    <PageShell
      title="Thread Pool Management"
      subtitle="Manage thread pools for optimized resource allocation and performance"
      actions={
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Thread Pool
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
                  <Cpu className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Pools</p>
                  <p className="text-2xl font-bold">{totalStats.totalPools}</p>
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
                  <p className="text-sm text-muted-foreground">Active Pools</p>
                  <p className="text-2xl font-bold">{totalStats.activePools}</p>
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
                  <p className="text-sm text-muted-foreground">Active Connections</p>
                  <p className="text-2xl font-bold">{totalStats.totalConnections}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Link className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Assignments</p>
                  <p className="text-2xl font-bold">{totalStats.totalAssignments}</p>
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
                  placeholder="Search thread pools by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thread Pools Table */}
        <Card>
          <CardHeader>
            <CardTitle>Thread Pool Overview</CardTitle>
            <CardDescription>
              Monitor and manage your thread pools for optimal performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPools.length === 0 ? (
              <div className="text-center py-12">
                <Cpu className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No thread pools found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterPriority !== 'all' || filterStatus !== 'all'
                    ? 'No thread pools match your current filters'
                    : 'Get started by creating your first thread pool'
                  }
                </p>
                {!searchTerm && filterPriority === 'all' && filterStatus === 'all' && (
                  <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create First Thread Pool
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pool Name</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Assignments</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPools.map((pool) => (
                      <TableRow key={pool.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{pool.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Max: {pool.max_connections} connections
                              {pool.delay_ms > 0 && ` • ${pool.delay_ms}ms delay`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(pool.priority)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(pool)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={getUtilizationPercentage(pool)} 
                                className="w-20 h-2" 
                              />
                              <span className="text-sm text-muted-foreground">
                                {Math.round(getUtilizationPercentage(pool))}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {pool.active_connections}/{pool.max_connections} active
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Timer className="w-3 h-3 text-blue-600" />
                              <span className="text-sm">{pool.average_response_time}ms</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-3 h-3 text-green-600" />
                              <span className="text-sm">{pool.uptime_percentage}% uptime</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Badge variant="outline" className="text-xs">
                                SMTP: {pool.assigned_smtp}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Badge variant="outline" className="text-xs">
                                IMAP: {pool.assigned_imap}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Campaigns: {pool.assigned_campaigns}
                              </Badge>
                            </div>
                          </div>
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
                                onClick={() => setEditingPool(pool)}
                                className="gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setAssigningPool(pool)
                                  setShowAssignModal(true)
                                }}
                                className="gap-2"
                              >
                                <Link className="w-4 h-4" />
                                Manage Assignments
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => togglePoolStatus(pool.id)}
                                className="gap-2"
                              >
                                {pool.enabled ? (
                                  <>
                                    <Pause className="w-4 h-4" />
                                    Disable
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4" />
                                    Enable
                                  </>
                                )}
                              </DropdownMenuItem>
                              <Separator className="my-1" />
                              <DropdownMenuItem
                                onClick={() => handleDeletePool(pool.id)}
                                className="gap-2 text-red-600 focus:text-red-600"
                                disabled={(pool.assigned_smtp + pool.assigned_imap + pool.assigned_campaigns) > 0}
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

      {/* Create Thread Pool Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Thread Pool</DialogTitle>
          </DialogHeader>
          <ThreadPoolForm
            onSubmit={handleCreatePool}
            onCancel={() => setShowCreateModal(false)}
            isLoading={loading}
            mode="create"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Thread Pool Modal */}
      <Dialog open={!!editingPool} onOpenChange={(open) => !open && setEditingPool(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Thread Pool</DialogTitle>
          </DialogHeader>
          {editingPool && (
            <ThreadPoolForm
              threadPool={editingPool}
              onSubmit={handleUpdatePool}
              onCancel={() => setEditingPool(null)}
              isLoading={loading}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Modal - Placeholder for future implementation */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Thread Pool Assignments</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">
            <Link className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Assignment Management</h3>
            <p className="text-muted-foreground mb-4">
              Assign this thread pool to SMTP servers, IMAP accounts, and campaigns for optimized resource allocation.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                Close
              </Button>
              <Button disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}