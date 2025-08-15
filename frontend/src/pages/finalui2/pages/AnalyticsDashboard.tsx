import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSessionId } from '@/utils/getSessionId'
import { campaignsApi } from '@/http/api'
import PageShell from '../components/PageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, Badge, Progress, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger, Label, Switch } from '@/components/ui/index'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import {
    ChartBarIcon,
    EnvelopeIcon,
    UserGroupIcon,
    ClockIcon,
    CpuChipIcon,
    WifiIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    FunnelIcon,
    BellIcon,
    EyeIcon,
    CursorArrowRaysIcon
} from '@heroicons/react/24/outline'

interface CampaignAnalytics {
    id: string
    name: string
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
    complained: number
    revenue: number
    status: string
    created_at: string
}

interface RealTimeMetrics {
    timestamp: string
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
    complained: number
}

interface AlertRule {
    id: string
    name: string
    metric: string
    threshold: number
    operator: 'gt' | 'lt' | 'eq'
    isActive: boolean
}

const AnalyticsDashboard: React.FC = () => {
    const sessionId = getSessionId()
    const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
    const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
    const [realTimeData, setRealTimeData] = useState<RealTimeMetrics[]>([])
    const [alertRules, setAlertRules] = useState<AlertRule[]>([
        { id: '1', name: 'High Bounce Rate', metric: 'bounce_rate', threshold: 5, operator: 'gt', isActive: true },
        { id: '2', name: 'Low Open Rate', metric: 'open_rate', threshold: 15, operator: 'lt', isActive: true },
        { id: '3', name: 'High Complaint Rate', metric: 'complaint_rate', threshold: 0.1, operator: 'gt', isActive: true }
    ])
    const [showAlerts, setShowAlerts] = useState(true)
    const [autoRefresh, setAutoRefresh] = useState(true)

    const { data: campaigns } = useQuery({
        queryKey: ['campaigns', sessionId],
        queryFn: () => campaignsApi.list(sessionId || ''),
        enabled: !!sessionId
    })

    const { data: analytics } = useQuery({
        queryKey: ['analytics', sessionId, timeRange],
        queryFn: async () => {
            if (!sessionId) return []
            const response = await fetch(`/api/analytics?session_id=${sessionId}&time_range=${timeRange}`)
            return response.json()
        },
        enabled: !!sessionId,
        refetchInterval: autoRefresh ? 5000 : false
    })

    // Simulate real-time data updates
    useEffect(() => {
        if (!autoRefresh) return

        const interval = setInterval(() => {
            const now = new Date()
            const newDataPoint: RealTimeMetrics = {
                timestamp: now.toISOString(),
                sent: Math.floor(Math.random() * 100) + 50,
                delivered: Math.floor(Math.random() * 90) + 45,
                opened: Math.floor(Math.random() * 30) + 15,
                clicked: Math.floor(Math.random() * 10) + 5,
                bounced: Math.floor(Math.random() * 5) + 1,
                unsubscribed: Math.floor(Math.random() * 2) + 0,
                complained: Math.floor(Math.random() * 1) + 0
            }

            setRealTimeData(prev => {
                const updated = [...prev, newDataPoint]
                // Keep only last 50 data points
                return updated.slice(-50)
            })
        }, 2000)

        return () => clearInterval(interval)
    }, [autoRefresh])

    const filteredCampaigns = useMemo(() => {
        if (selectedCampaigns.length === 0) return campaigns || []
        return (campaigns || []).filter(c => selectedCampaigns.includes(c.id))
    }, [campaigns, selectedCampaigns])

    const totalMetrics = useMemo(() => {
        return filteredCampaigns.reduce((acc, campaign) => ({
            sent: acc.sent + campaign.sent,
            delivered: acc.delivered + campaign.delivered,
            opened: acc.opened + campaign.opened,
            clicked: acc.clicked + campaign.clicked,
            bounced: acc.bounced + campaign.bounced,
            unsubscribed: acc.unsubscribed + campaign.unsubscribed,
            complained: acc.complained + campaign.complained,
            revenue: acc.revenue + campaign.revenue
        }), {
            sent: 0, delivered: 0, opened: 0, clicked: 0,
            bounced: 0, unsubscribed: 0, complained: 0, revenue: 0
        })
    }, [filteredCampaigns])

    const performanceMetrics = useMemo(() => {
        if (totalMetrics.sent === 0) return {}

        return {
            deliveryRate: (totalMetrics.delivered / totalMetrics.sent) * 100,
            openRate: (totalMetrics.opened / totalMetrics.delivered) * 100,
            clickRate: (totalMetrics.clicked / totalMetrics.opened) * 100,
            bounceRate: (totalMetrics.bounced / totalMetrics.sent) * 100,
            unsubscribeRate: (totalMetrics.unsubscribed / totalMetrics.delivered) * 100,
            complaintRate: (totalMetrics.complained / totalMetrics.delivered) * 100
        }
    }, [totalMetrics])

    const chartData = useMemo(() => {
        return filteredCampaigns.map(campaign => ({
            name: campaign.name,
            sent: campaign.sent,
            delivered: campaign.delivered,
            opened: campaign.opened,
            clicked: campaign.clicked,
            bounced: campaign.bounced,
            unsubscribed: campaign.unsubscribed,
            complained: campaign.complained
        }))
    }, [filteredCampaigns])

    const realTimeChartData = useMemo(() => {
        return realTimeData.map((point, index) => ({
            time: index,
            sent: point.sent,
            delivered: point.delivered,
            opened: point.opened,
            clicked: point.clicked
        }))
    }, [realTimeData])

    const addAlertRule = () => {
        const newRule: AlertRule = {
            id: Date.now().toString(),
            name: 'New Alert Rule',
            metric: 'open_rate',
            threshold: 20,
            operator: 'lt',
            isActive: true
        }
        setAlertRules(prev => [...prev, newRule])
    }

    const updateAlertRule = (id: string, updates: Partial<AlertRule>) => {
        setAlertRules(prev => prev.map(rule =>
            rule.id === id ? { ...rule, ...updates } : rule
        ))
    }

    const deleteAlertRule = (id: string) => {
        setAlertRules(prev => prev.filter(rule => rule.id !== id))
    }

    return (
        <PageShell
            title="Analytics Dashboard"
            subtitle="Real-time campaign performance and insights"
            breadcrumbs={[
                { label: 'Home', href: '/' },
                { label: 'Analytics' }
            ]}
        >
            <div className="space-y-6">
                {/* Controls and Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label>Campaigns:</Label>
                                <Select
                                    value={selectedCampaigns.length === 0 ? 'all' : 'custom'}
                                    onValueChange={(value) => {
                                        if (value === 'all') setSelectedCampaigns([])
                                    }}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Campaigns</SelectItem>
                                        <SelectItem value="custom">Custom Selection</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedCampaigns.length === 0 && (
                                <div className="flex items-center gap-2">
                                    <Label>Time Range:</Label>
                                    <Select value={timeRange} onValueChange={(value: unknown) => setTimeRange(value)}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1h">Last Hour</SelectItem>
                                            <SelectItem value="24h">Last 24h</SelectItem>
                                            <SelectItem value="7d">Last 7 Days</SelectItem>
                                            <SelectItem value="30d">Last 30 Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                                <Label>Auto-refresh</Label>
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch checked={showAlerts} onCheckedChange={setShowAlerts} />
                                <Label>Show Alerts</Label>
                            </div>
                        </div>

                        {selectedCampaigns.length === 0 && (
                            <div className="mt-4">
                                <Label>Campaign Selection:</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 max-h-32 overflow-auto p-2 border rounded-md">
                                    {(campaigns || []).map(campaign => (
                                        <label key={campaign.id} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                className="accent-primary"
                                                checked={selectedCampaigns.includes(campaign.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedCampaigns(prev => [...prev, campaign.id])
                                                    } else {
                                                        setSelectedCampaigns(prev => prev.filter(id => id !== campaign.id))
                                                    }
                                                }}
                                            />
                                            <span className="truncate">{campaign.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                            <EnvelopeIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalMetrics.sent.toLocaleString()}</div>
                            <Progress value={performanceMetrics.deliveryRate || 0} className="mt-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                                {performanceMetrics.deliveryRate?.toFixed(1)}% delivery rate
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                            <EyeIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{performanceMetrics.openRate?.toFixed(1)}%</div>
                            <Progress value={performanceMetrics.openRate || 0} className="mt-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                                {totalMetrics.opened.toLocaleString()} opens
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                            <CursorArrowRaysIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{performanceMetrics.clickRate?.toFixed(1)}%</div>
                            <Progress value={performanceMetrics.clickRate || 0} className="mt-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                                {totalMetrics.clicked.toLocaleString()} clicks
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${totalMetrics.revenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                ${((totalMetrics.revenue / totalMetrics.clicked) || 0).toFixed(2)} per click
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <Tabs defaultValue="performance" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="performance">Performance Overview</TabsTrigger>
                        <TabsTrigger value="realtime">Real-time Metrics</TabsTrigger>
                        <TabsTrigger value="campaigns">Campaign Comparison</TabsTrigger>
                        <TabsTrigger value="alerts">Alert Rules</TabsTrigger>
                    </TabsList>

                    <TabsContent value="performance" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Delivery Performance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Area type="monotone" dataKey="sent" stackId="1" stroke="#8884d8" fill="#8884d8" />
                                            <Area type="monotone" dataKey="delivered" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                                            <Area type="monotone" dataKey="bounced" stackId="1" stroke="#ffc658" fill="#ffc658" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Engagement Metrics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Bar dataKey="opened" fill="#8884d8" />
                                            <Bar dataKey="clicked" fill="#82ca9d" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="realtime" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Real-time Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={realTimeChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="time" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Line type="monotone" dataKey="sent" stroke="#8884d8" strokeWidth={2} />
                                        <Line type="monotone" dataKey="delivered" stroke="#82ca9d" strokeWidth={2} />
                                        <Line type="monotone" dataKey="opened" stroke="#ffc658" strokeWidth={2} />
                                        <Line type="monotone" dataKey="clicked" stroke="#ff7300" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="campaigns" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Campaign Performance Comparison</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={chartData} layout="horizontal">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={150} />
                                        <RechartsTooltip />
                                        <Bar dataKey="open_rate" fill="#8884d8" name="Open Rate %" />
                                        <Bar dataKey="click_rate" fill="#82ca9d" name="Click Rate %" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="alerts" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Alert Rules</CardTitle>
                                <Button onClick={addAlertRule} size="sm">
                                    <BellIcon className="w-4 h-4 mr-1" />
                                    Add Rule
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {alertRules.map(rule => (
                                        <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Switch
                                                    checked={rule.isActive}
                                                    onCheckedChange={(checked) => updateAlertRule(rule.id, { isActive: checked })}
                                                />
                                                <div>
                                                    <div className="font-medium">{rule.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {rule.metric.replace('_', ' ')} {rule.operator === 'gt' ? '>' : rule.operator === 'lt' ? '<' : '='} {rule.threshold}%
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => deleteAlertRule(rule.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </PageShell>
    )
}

export default AnalyticsDashboard 