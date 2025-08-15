import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSessionId } from '@/utils/getSessionId'
import PageShell from '../components/PageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, Input, Label, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Switch, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, Progress, Calendar } from '@/components/ui/index'
import {
    ChartBarIcon,
    DocumentTextIcon,
    ArrowDownTrayIcon,
    ClockIcon,
    PlusIcon,
    TrashIcon,
    EyeIcon,
    CogIcon,
    CalendarIcon,
    EnvelopeIcon,
    UserGroupIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { toast } from '@/hooks/useToast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface CustomDashboard {
    id: string
    name: string
    description: string
    widgets: DashboardWidget[]
    isPublic: boolean
    createdBy: string
    createdAt: string
    lastModified: string
}

interface DashboardWidget {
    id: string
    type: 'metric' | 'chart' | 'table' | 'progress'
    title: string
    config: any
    position: { x: number; y: number; w: number; h: number }
}

interface ScheduledReport {
    id: string
    name: string
    type: 'email' | 'pdf' | 'csv'
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    recipients: string[]
    lastSent?: string
    nextSend?: string
    isActive: boolean
    template: string
}

const AdvancedReportingPage: React.FC = () => {
    const sessionId = getSessionId()
    const queryClient = useQueryClient()

    const [activeTab, setActiveTab] = useState('dashboards')
    const [showCreateDashboard, setShowCreateDashboard] = useState(false)
    const [showCreateReport, setShowCreateReport] = useState(false)
    const [selectedDashboard, setSelectedDashboard] = useState<CustomDashboard | null>(null)

    const [newDashboard, setNewDashboard] = useState({
        name: '',
        description: '',
        isPublic: false
    })

    const [newReport, setNewReport] = useState({
        name: '',
        type: 'email' as const,
        frequency: 'weekly' as const,
        recipients: '',
        template: ''
    })

    // Sample data for charts
    const sampleData = [
        { month: 'Jan', sent: 12000, delivered: 11500, opened: 3450, clicked: 690 },
        { month: 'Feb', sent: 15000, delivered: 14200, opened: 4260, clicked: 852 },
        { month: 'Mar', sent: 18000, delivered: 17100, opened: 5130, clicked: 1026 },
        { month: 'Apr', sent: 22000, delivered: 20900, opened: 6270, clicked: 1254 },
        { month: 'May', sent: 25000, delivered: 23750, opened: 7125, clicked: 1425 },
        { month: 'Jun', sent: 28000, delivered: 26600, opened: 7980, clicked: 1596 }
    ]

    const [dashboards, setDashboards] = useState<CustomDashboard[]>([
        {
            id: '1',
            name: 'Executive Overview',
            description: 'High-level metrics for executive team',
            isPublic: true,
            createdBy: 'admin@company.com',
            createdAt: '2024-01-01T00:00:00Z',
            lastModified: '2024-01-15T00:00:00Z',
            widgets: [
                {
                    id: 'w1',
                    type: 'metric',
                    title: 'Total Revenue',
                    config: { value: '$125,430', change: '+12.5%', trend: 'up' },
                    position: { x: 0, y: 0, w: 3, h: 2 }
                },
                {
                    id: 'w2',
                    type: 'chart',
                    title: 'Campaign Performance',
                    config: { chartType: 'line', data: sampleData },
                    position: { x: 3, y: 0, w: 6, h: 4 }
                }
            ]
        },
        {
            id: '2',
            name: 'Marketing Team',
            description: 'Detailed metrics for marketing team',
            isPublic: false,
            createdBy: 'marketing@company.com',
            createdAt: '2024-01-05T00:00:00Z',
            lastModified: '2024-01-20T00:00:00Z',
            widgets: [
                {
                    id: 'w3',
                    type: 'metric',
                    title: 'Open Rate',
                    config: { value: '24.5%', change: '+2.1%', trend: 'up' },
                    position: { x: 0, y: 0, w: 2, h: 2 }
                }
            ]
        }
    ])

    const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
        {
            id: '1',
            name: 'Weekly Performance Report',
            type: 'email',
            frequency: 'weekly',
            recipients: ['executives@company.com', 'marketing@company.com'],
            isActive: true,
            template: 'weekly-performance',
            lastSent: '2024-01-15T00:00:00Z',
            nextSend: '2024-01-22T00:00:00Z'
        },
        {
            id: '2',
            name: 'Monthly Analytics Summary',
            type: 'pdf',
            frequency: 'monthly',
            recipients: ['board@company.com'],
            isActive: true,
            template: 'monthly-summary',
            lastSent: '2024-01-01T00:00:00Z',
            nextSend: '2024-02-01T00:00:00Z'
        }
    ])

    const createDashboard = () => {
        if (!newDashboard.name.trim()) {
            toast.error?.('Please enter a dashboard name')
            return
        }

        const dashboard: CustomDashboard = {
            id: Date.now().toString(),
            name: newDashboard.name,
            description: newDashboard.description,
            isPublic: newDashboard.isPublic,
            createdBy: 'current-user@company.com',
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            widgets: []
        }

        setDashboards(prev => [...prev, dashboard])
        setNewDashboard({ name: '', description: '', isPublic: false })
        setShowCreateDashboard(false)
        toast.success?.('Dashboard created successfully')
    }

    const createReport = () => {
        if (!newReport.name.trim() || !newReport.recipients.trim()) {
            toast.error?.('Please fill in all required fields')
            return
        }

        const report: ScheduledReport = {
            id: Date.now().toString(),
            name: newReport.name,
            type: newReport.type,
            frequency: newReport.frequency,
            recipients: newReport.recipients.split(',').map(r => r.trim()),
            isActive: true,
            template: newReport.template || 'default',
            nextSend: calculateNextSendDate(newReport.frequency)
        }

        setScheduledReports(prev => [...prev, report])
        setNewReport({ name: '', type: 'email', frequency: 'weekly', recipients: '', template: '' })
        setShowCreateReport(false)
        toast.success?.('Scheduled report created successfully')
    }

    const calculateNextSendDate = (frequency: string): string => {
        const now = new Date()
        switch (frequency) {
            case 'daily':
                return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
            case 'weekly':
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
            case 'monthly':
                return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString()
            case 'quarterly':
                return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()).toISOString()
            default:
                return now.toISOString()
        }
    }

    const deleteDashboard = (id: string) => {
        setDashboards(prev => prev.filter(d => d.id !== id))
        toast.success?.('Dashboard deleted successfully')
    }

    const deleteReport = (id: string) => {
        setScheduledReports(prev => prev.filter(r => r.id !== id))
        toast.success?.('Scheduled report deleted successfully')
    }

    const toggleReportStatus = (id: string) => {
        setScheduledReports(prev => prev.map(r =>
            r.id === id ? { ...r, isActive: !r.isActive } : r
        ))
    }

    const exportDashboard = (dashboard: CustomDashboard) => {
        const data = {
            name: dashboard.name,
            description: dashboard.description,
            widgets: dashboard.widgets,
            exportDate: new Date().toISOString()
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${dashboard.name}-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        window.URL.revokeObjectURL(url)

        toast.success?.('Dashboard exported successfully')
    }

    return (
        <PageShell
            title="Advanced Reporting"
            subtitle="Custom dashboards, scheduled reports, and analytics exports"
            breadcrumbs={[
                { label: 'Home', href: '/' },
                { label: 'Reporting' }
            ]}
        >
            <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Dashboards</CardTitle>
                            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboards.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Custom dashboards created
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Scheduled Reports</CardTitle>
                            <ClockIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{scheduledReports.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Active scheduled reports
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Widgets</CardTitle>
                            <CogIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {dashboards.reduce((sum, d) => sum + d.widgets.length, 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Dashboard widgets
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Last Export</CardTitle>
                            <ArrowDownTrayIcon className="h-4 w-4 text-muted-foreground" />
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
                        <TabsTrigger value="dashboards">Custom Dashboards</TabsTrigger>
                        <TabsTrigger value="reports">Scheduled Reports</TabsTrigger>
                        <TabsTrigger value="templates">Report Templates</TabsTrigger>
                        <TabsTrigger value="exports">Data Exports</TabsTrigger>
                    </TabsList>

                    {/* Custom Dashboards Tab */}
                    <TabsContent value="dashboards" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Custom Dashboards</CardTitle>
                                <Button onClick={() => setShowCreateDashboard(true)}>
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    Create Dashboard
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {dashboards.map(dashboard => (
                                        <Card key={dashboard.id} className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-medium">{dashboard.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{dashboard.description}</p>
                                                </div>
                                                <Badge variant={dashboard.isPublic ? 'default' : 'secondary'}>
                                                    {dashboard.isPublic ? 'Public' : 'Private'}
                                                </Badge>
                                            </div>

                                            <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                                <div>Widgets: {dashboard.widgets.length}</div>
                                                <div>Created: {new Date(dashboard.createdAt).toLocaleDateString()}</div>
                                                <div>Modified: {new Date(dashboard.lastModified).toLocaleDateString()}</div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedDashboard(dashboard)}
                                                    className="flex-1"
                                                >
                                                    <EyeIcon className="w-4 h-4 mr-2" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => exportDashboard(dashboard)}
                                                >
                                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => deleteDashboard(dashboard.id)}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Scheduled Reports Tab */}
                    <TabsContent value="reports" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Scheduled Reports</CardTitle>
                                <Button onClick={() => setShowCreateReport(true)}>
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    Schedule Report
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {scheduledReports.map(report => (
                                        <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{report.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {report.type.toUpperCase()} • {report.frequency} • {report.recipients.length} recipients
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="text-right text-sm">
                                                    <div>Next: {report.nextSend ? new Date(report.nextSend).toLocaleDateString() : 'N/A'}</div>
                                                    <div className="text-muted-foreground">
                                                        {report.lastSent ? `Last: ${new Date(report.lastSent).toLocaleDateString()}` : 'Never sent'}
                                                    </div>
                                                </div>

                                                <Switch
                                                    checked={report.isActive}
                                                    onCheckedChange={() => toggleReportStatus(report.id)}
                                                />

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => deleteReport(report.id)}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Report Templates Tab */}
                    <TabsContent value="templates" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Report Templates</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { name: 'Executive Summary', description: 'High-level metrics for executives', type: 'PDF' },
                                        { name: 'Marketing Performance', description: 'Detailed marketing metrics', type: 'Email' },
                                        { name: 'Sales Report', description: 'Revenue and conversion data', type: 'CSV' },
                                        { name: 'Weekly Digest', description: 'Weekly performance summary', type: 'Email' },
                                        { name: 'Monthly Analytics', description: 'Comprehensive monthly report', type: 'PDF' },
                                        { name: 'Custom Template', description: 'Create your own template', type: 'Custom' }
                                    ].map((template, index) => (
                                        <Card key={index} className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-medium">{template.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{template.description}</p>
                                                </div>
                                                <Badge variant="outline">{template.type}</Badge>
                                            </div>

                                            <Button variant="outline" size="sm" className="w-full">
                                                <EyeIcon className="w-4 h-4 mr-2" />
                                                Preview Template
                                            </Button>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Data Exports Tab */}
                    <TabsContent value="exports" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Data Export Center</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Campaign Data</h3>
                                            <div className="space-y-3">
                                                <Button variant="outline" className="w-full justify-start">
                                                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                                    Export Campaign Performance
                                                </Button>
                                                <Button variant="outline" className="w-full justify-start">
                                                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                                    Export Email Metrics
                                                </Button>
                                                <Button variant="outline" className="w-full justify-start">
                                                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                                    Export A/B Test Results
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Audience Data</h3>
                                            <div className="space-y-3">
                                                <Button variant="outline" className="w-full justify-start">
                                                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                                    Export Lead Lists
                                                </Button>
                                                <Button variant="outline" className="w-full justify-start">
                                                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                                    Export Segmentation Data
                                                </Button>
                                                <Button variant="outline" className="w-full justify-start">
                                                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                                    Export Engagement History
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Custom Export</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <Label>Data Type</Label>
                                                <Select>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select data type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="campaigns">Campaigns</SelectItem>
                                                        <SelectItem value="leads">Leads</SelectItem>
                                                        <SelectItem value="templates">Templates</SelectItem>
                                                        <SelectItem value="analytics">Analytics</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Date Range</Label>
                                                <Select>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select range" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="7d">Last 7 days</SelectItem>
                                                        <SelectItem value="30d">Last 30 days</SelectItem>
                                                        <SelectItem value="90d">Last 90 days</SelectItem>
                                                        <SelectItem value="custom">Custom range</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Format</Label>
                                                <Select>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select format" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="csv">CSV</SelectItem>
                                                        <SelectItem value="json">JSON</SelectItem>
                                                        <SelectItem value="xlsx">Excel</SelectItem>
                                                        <SelectItem value="pdf">PDF</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <Button className="w-full">
                                            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                            Generate Custom Export
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Create Dashboard Dialog */}
                <Dialog open={showCreateDashboard} onOpenChange={setShowCreateDashboard}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Custom Dashboard</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Dashboard Name</Label>
                                <Input
                                    value={newDashboard.name}
                                    onChange={(e) => setNewDashboard(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Executive Overview"
                                />
                            </div>

                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={newDashboard.description}
                                    onChange={(e) => setNewDashboard(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe what this dashboard will show"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={newDashboard.isPublic}
                                    onCheckedChange={(checked) => setNewDashboard(prev => ({ ...prev, isPublic: checked }))}
                                />
                                <Label>Make dashboard public</Label>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowCreateDashboard(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={createDashboard}>
                                    Create Dashboard
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Create Report Dialog */}
                <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Schedule New Report</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Report Name</Label>
                                <Input
                                    value={newReport.name}
                                    onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Weekly Performance Report"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Report Type</Label>
                                    <Select value={newReport.type} onValueChange={(value: any) => setNewReport(prev => ({ ...prev, type: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="pdf">PDF</SelectItem>
                                            <SelectItem value="csv">CSV</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Frequency</Label>
                                    <Select value={newReport.frequency} onValueChange={(value: any) => setNewReport(prev => ({ ...prev, frequency: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label>Recipients (comma-separated)</Label>
                                <Input
                                    value={newReport.recipients}
                                    onChange={(e) => setNewReport(prev => ({ ...prev, recipients: e.target.value }))}
                                    placeholder="email1@company.com, email2@company.com"
                                />
                            </div>

                            <div>
                                <Label>Template (Optional)</Label>
                                <Select value={newReport.template} onValueChange={(value: any) => setNewReport(prev => ({ ...prev, template: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="executive-summary">Executive Summary</SelectItem>
                                        <SelectItem value="marketing-performance">Marketing Performance</SelectItem>
                                        <SelectItem value="weekly-digest">Weekly Digest</SelectItem>
                                        <SelectItem value="custom">Custom Template</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowCreateReport(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={createReport}>
                                    Schedule Report
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Dashboard Preview Dialog */}
                <Dialog open={!!selectedDashboard} onOpenChange={() => setSelectedDashboard(null)}>
                    <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedDashboard?.name}</DialogTitle>
                        </DialogHeader>
                        {selectedDashboard && (
                            <div className="space-y-4">
                                <div className="text-sm text-muted-foreground">
                                    {selectedDashboard.description}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedDashboard.widgets.map(widget => (
                                        <Card key={widget.id} className="p-4">
                                            <h4 className="font-medium mb-3">{widget.title}</h4>

                                            {widget.type === 'metric' && (
                                                <div className="text-center">
                                                    <div className="text-3xl font-bold text-primary">
                                                        {widget.config.value}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {widget.config.change}
                                                    </div>
                                                </div>
                                            )}

                                            {widget.type === 'chart' && (
                                                <div className="h-48">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={widget.config.data}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="month" />
                                                            <YAxis />
                                                            <RechartsTooltip />
                                                            <Area type="monotone" dataKey="sent" stackId="1" stroke="#8884d8" fill="#8884d8" />
                                                            <Area type="monotone" dataKey="delivered" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => exportDashboard(selectedDashboard)}>
                                        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                        Export Dashboard
                                    </Button>
                                    <Button>
                                        <CogIcon className="w-4 h-4 mr-2" />
                                        Edit Dashboard
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </PageShell>
    )
}

export default AdvancedReportingPage 