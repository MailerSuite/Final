import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Zap,
  Globe,
  FileText,
  Target,
  Network,
  Lock,
  TrendingUp,
  Eye
} from 'lucide-react'
import PageShell from '../components/PageShell'
import SecurityTestingForm from '@/components/security/SecurityTestingForm'

interface SecurityTest {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'infrastructure' | 'content' | 'reputation' | 'authentication'
  difficulty: 'basic' | 'intermediate' | 'advanced'
  estimatedTime: string
  features: string[]
}

const securityTests: SecurityTest[] = [
  {
    id: 'spf-test',
    name: 'SPF Record Validation',
    description: 'Validate your domain\'s Sender Policy Framework configuration for email authentication',
    icon: <Shield className="w-6 h-6" />,
    category: 'authentication',
    difficulty: 'basic',
    estimatedTime: '30 seconds',
    features: [
      'SPF record detection',
      'Syntax validation',
      'Include chain analysis',
      'DNS lookup optimization'
    ]
  },
  {
    id: 'domain-test',
    name: 'Domain Configuration',
    description: 'Comprehensive analysis of your domain\'s email infrastructure setup',
    icon: <Globe className="w-6 h-6" />,
    category: 'infrastructure',
    difficulty: 'intermediate',
    estimatedTime: '2 minutes',
    features: [
      'MX record validation',
      'DKIM configuration',
      'DMARC policy check',
      'Domain reputation analysis'
    ]
  },
  {
    id: 'content-test',
    name: 'Email Content Security',
    description: 'Analyze email content for spam indicators and security vulnerabilities',
    icon: <FileText className="w-6 h-6" />,
    category: 'content',
    difficulty: 'intermediate',
    estimatedTime: '1 minute',
    features: [
      'Spam word detection',
      'Link safety verification',
      'Image optimization check',
      'HTML structure analysis'
    ]
  },
  {
    id: 'blacklist-test',
    name: 'IP Blacklist Check',
    description: 'Check if your sending IPs are listed on major email blacklists',
    icon: <Target className="w-6 h-6" />,
    category: 'reputation',
    difficulty: 'basic',
    estimatedTime: '1 minute',
    features: [
      'Spamhaus monitoring',
      'Barracuda checks',
      'SURBL validation',
      'Reputation scoring'
    ]
  },
  {
    id: 'headers-test',
    name: 'Email Headers Analysis',
    description: 'Deep analysis of email headers for authentication and routing security',
    icon: <Network className="w-6 h-6" />,
    category: 'authentication',
    difficulty: 'advanced',
    estimatedTime: '45 seconds',
    features: [
      'Authentication headers',
      'Routing path analysis',
      'Security header validation',
      'Header consistency check'
    ]
  }
]

export default function SecurityTestingPage() {
  const [showTestingForm, setShowTestingForm] = useState(false)
  const [recentTests] = useState([
    {
      testName: 'SPF Record Validation',
      domain: 'example.com',
      score: 95,
      status: 'passed',
      timestamp: '2 hours ago'
    },
    {
      testName: 'Domain Configuration',
      domain: 'mydomain.com',
      score: 78,
      status: 'warning',
      timestamp: '1 day ago'
    },
    {
      testName: 'IP Blacklist Check',
      domain: '203.0.113.1',
      score: 45,
      status: 'failed',
      timestamp: '2 days ago'
    }
  ])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'infrastructure': return 'bg-blue-100 text-blue-800'
      case 'content': return 'bg-green-100 text-green-800'
      case 'reputation': return 'bg-purple-100 text-purple-800'
      case 'authentication': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />
      default: return <Eye className="w-4 h-4 text-gray-600" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <PageShell
      title="Security Testing Suite"
      subtitle="Comprehensive security validation for your email infrastructure and content"
      actions={
        <Button onClick={() => setShowTestingForm(true)} className="gap-2">
          <Play className="w-4 h-4" />
          Run Security Tests
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Security Score</p>
                  <p className="text-2xl font-bold text-green-600">A+</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tests Passed</p>
                  <p className="text-2xl font-bold">18/20</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deliverability</p>
                  <p className="text-2xl font-bold">96%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Lock className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Auth Score</p>
                  <p className="text-2xl font-bold">98/100</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Security Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Available Security Tests</CardTitle>
            <CardDescription>
              Choose from our comprehensive suite of security validation tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {securityTests.map((test) => (
                <Card key={test.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {test.icon}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge className={getDifficultyColor(test.difficulty)} variant="outline">
                            {test.difficulty}
                          </Badge>
                          <Badge className={getCategoryColor(test.category)} variant="outline">
                            {test.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-sm">{test.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {test.description}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Estimated time:</span>
                          <span className="font-medium">{test.estimatedTime}</span>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Features:</p>
                          <div className="space-y-1">
                            {test.features.slice(0, 3).map((feature, index) => (
                              <div key={index} className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                {feature}
                              </div>
                            ))}
                            {test.features.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{test.features.length - 3} more features
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={() => setShowTestingForm(true)}
                      >
                        <Play className="w-3 h-3" />
                        Run Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Results</CardTitle>
            <CardDescription>
              Your latest security test results and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTests.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No test results yet</h3>
                <p className="text-muted-foreground mb-4">
                  Run your first security test to see results here
                </p>
                <Button onClick={() => setShowTestingForm(true)} className="gap-2">
                  <Play className="w-4 h-4" />
                  Run First Test
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{test.testName}</span>
                          <Badge variant="outline" className="text-xs">
                            {test.domain}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {test.timestamp}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${getScoreColor(test.score)}`}>
                        {test.score}/100
                      </span>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle>Security Best Practices</CardTitle>
            <CardDescription>
              Follow these recommendations to maintain optimal email security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Authentication Setup
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    Configure SPF records for all sending domains
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    Implement DKIM signing for email authentication
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    Set up DMARC policy for domain protection
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  Reputation Management
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    Monitor IP reputation regularly
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    Implement feedback loops with ISPs
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    Maintain clean mailing lists
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  Content Security
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    Avoid spam trigger words in content
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    Optimize image-to-text ratio
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    Validate all URLs and links
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Network className="w-4 h-4 text-orange-600" />
                  Infrastructure
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    Use dedicated IP addresses
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    Implement proper SSL/TLS encryption
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    Regular security audits and updates
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Testing Modal */}
      <Dialog open={showTestingForm} onOpenChange={setShowTestingForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Security Testing Suite</DialogTitle>
          </DialogHeader>
          <SecurityTestingForm onClose={() => setShowTestingForm(false)} />
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}