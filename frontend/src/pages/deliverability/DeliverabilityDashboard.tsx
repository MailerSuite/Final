import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface DeliverabilityMetric {
  label: string
  value: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  description: string
}

interface DomainReputation {
  domain: string
  reputation: number
  status: 'healthy' | 'warning' | 'blacklisted'
  provider: string
  lastChecked: string
  issues: string[]
}

const DeliverabilityDashboard: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')

  const metrics: DeliverabilityMetric[] = [
    {
      label: 'Sender Reputation',
      value: 85,
      status: 'good',
      trend: 'up',
      description: 'Your overall sender reputation score across major email providers'
    },
    {
      label: 'Delivery Rate',
      value: 94,
      status: 'excellent',
      trend: 'stable',
      description: 'Percentage of emails successfully delivered to recipient inboxes'
    },
    {
      label: 'Spam Score',
      value: 12,
      status: 'warning',
      trend: 'down',
      description: 'Lower is better. Percentage of emails marked as spam'
    },
    {
      label: 'Bounce Rate',
      value: 3,
      status: 'excellent',
      trend: 'down',
      description: 'Percentage of emails that bounced back'
    }
  ]

  const domainReputations: DomainReputation[] = [
    {
      domain: 'example.com',
      reputation: 88,
      status: 'healthy',
      provider: 'All providers',
      lastChecked: '2 hours ago',
      issues: []
    },
    {
      domain: 'marketing.example.com',
      reputation: 72,
      status: 'warning',
      provider: 'Gmail',
      lastChecked: '1 hour ago',
      issues: ['High bounce rate detected', 'SPF record needs update']
    },
    {
      domain: 'newsletter.example.com',
      reputation: 45,
      status: 'blacklisted',
      provider: 'Outlook',
      lastChecked: '30 minutes ago',
      issues: ['Listed on Spamhaus', 'Missing DMARC record', 'High complaint rate']
    }
  ]

  const recommendations = [
    {
      priority: 'high',
      title: 'Fix DMARC Configuration',
      description: 'Your DMARC record is missing or misconfigured, affecting deliverability.',
      action: 'Configure DMARC',
      impact: 'High deliverability improvement'
    },
    {
      priority: 'medium',
      title: 'Reduce Bounce Rate',
      description: 'Clean your email list to remove invalid addresses.',
      action: 'Clean Email List',
      impact: 'Medium deliverability improvement'
    },
    {
      priority: 'low',
      title: 'Optimize Send Time',
      description: 'Send emails at optimal times to improve engagement.',
      action: 'Adjust Schedule',
      impact: 'Low-medium improvement'
    }
  ]

  const authenticationRecords = [
    {
      type: 'SPF',
      status: 'valid',
      value: 'v=spf1 include:_spf.google.com ~all',
      lastChecked: '1 hour ago'
    },
    {
      type: 'DKIM',
      status: 'valid',
      value: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA...',
      lastChecked: '1 hour ago'
    },
    {
      type: 'DMARC',
      status: 'warning',
      value: 'v=DMARC1; p=none; rua=mailto:dmarc@example.com',
      lastChecked: '2 hours ago'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'healthy':
      case 'valid':
        return 'text-green-600'
      case 'good':
        return 'text-blue-600'
      case 'warning':
        return 'text-yellow-600'
      case 'critical':
      case 'blacklisted':
      case 'invalid':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'healthy':
      case 'valid':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'good':
        return <CheckCircleIcon className="h-5 w-5 text-blue-600" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
      case 'critical':
      case 'blacklisted':
      case 'invalid':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Deliverability</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your sender reputation and optimize email deliverability
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <ShieldCheckIcon className="h-4 w-4 mr-2" />
            Run Deliverability Test
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </CardTitle>
                {getTrendIcon(metric.trend)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">{metric.value}%</span>
                  {getStatusIcon(metric.status)}
                </div>
                <Progress value={metric.value} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="domains">Domain Reputation</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Reputation Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ChartBarIcon className="h-5 w-5" />
                  <span>Sender Reputation Trend</span>
                </CardTitle>
                <CardDescription>
                  Your reputation score over the last {selectedTimeframe}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Score</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">85</span>
                      <Badge variant="secondary">Good</Badge>
                    </div>
                  </div>
                  <Progress value={85} className="h-3" />
                  <div className="text-xs text-muted-foreground">
                    Improved by 5 points in the last week
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <span>Recent Issues</span>
                </CardTitle>
                <CardDescription>
                  Issues detected in the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">High bounce rate detected</p>
                      <p className="text-xs text-muted-foreground">newsletter.example.com</p>
                    </div>
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Blacklist detection</p>
                      <p className="text-xs text-muted-foreground">marketing.example.com</p>
                    </div>
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">SPF record updated</p>
                      <p className="text-xs text-muted-foreground">example.com</p>
                    </div>
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common actions to improve your deliverability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                  <EnvelopeIcon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Test Email Delivery</div>
                    <div className="text-xs text-muted-foreground">Send test emails to check deliverability</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                  <GlobeAltIcon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Check DNS Records</div>
                    <div className="text-xs text-muted-foreground">Verify SPF, DKIM, and DMARC setup</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                  <ShieldCheckIcon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Blacklist Check</div>
                    <div className="text-xs text-muted-foreground">Check if domains are blacklisted</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Domain Reputation Status</CardTitle>
              <CardDescription>
                Monitor the reputation of your sending domains across email providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Reputation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domainReputations.map((domain) => (
                    <TableRow key={domain.domain}>
                      <TableCell className="font-medium">{domain.domain}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{domain.reputation}%</span>
                          <Progress value={domain.reputation} className="w-16 h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(domain.status)}
                          <span className={cn("capitalize", getStatusColor(domain.status))}>
                            {domain.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{domain.provider}</TableCell>
                      <TableCell className="text-muted-foreground">{domain.lastChecked}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {domain.issues.length === 0 ? (
                            <span className="text-green-600">No issues</span>
                          ) : (
                            domain.issues.slice(0, 2).map((issue, index) => (
                              <Badge key={index} variant="outline" className="block text-xs">
                                {issue}
                              </Badge>
                            ))
                          )}
                          {domain.issues.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{domain.issues.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DNS Authentication Records</CardTitle>
              <CardDescription>
                Verify your SPF, DKIM, and DMARC records are properly configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {authenticationRecords.map((record) => (
                  <div key={record.type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{record.type}</h3>
                        {getStatusIcon(record.status)}
                        <span className={cn("capitalize", getStatusColor(record.status))}>
                          {record.status}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Last checked: {record.lastChecked}
                      </span>
                    </div>
                    <div className="bg-muted p-3 rounded font-mono text-sm break-all">
                      {record.value}
                    </div>
                    {record.status === 'warning' && (
                      <Alert className="mt-3">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <AlertDescription>
                          This record needs attention. Consider updating to improve deliverability.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        rec.priority === 'high' ? 'bg-red-500' :
                        rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      )} />
                      <div>
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                        <CardDescription>{rec.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                      {rec.priority} priority
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Expected impact:</p>
                      <p className="font-medium">{rec.impact}</p>
                    </div>
                    <Button>
                      {rec.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DeliverabilityDashboard