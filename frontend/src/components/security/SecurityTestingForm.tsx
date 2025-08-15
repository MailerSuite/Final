import React, { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Globe, 
  Mail, 
  Server, 
  Lock,
  Eye,
  FileText,
  Zap,
  Network,
  Target
} from 'lucide-react'
import { toast } from '@/hooks/useToast'

// Schema definitions for different test types
const spfTestSchema = z.object({
  domain: z.string().min(1, { message: 'Domain is required' }),
  expected_result: z.enum(['pass', 'fail', 'neutral', 'softfail'], { message: 'Please select expected result' }).optional(),
})

const domainTestSchema = z.object({
  domain: z.string().min(1, { message: 'Domain is required' }),
  check_mx: z.boolean().default(true),
  check_dkim: z.boolean().default(true),
  check_dmarc: z.boolean().default(true),
  check_spf: z.boolean().default(true),
})

const emailContentTestSchema = z.object({
  subject: z.string().min(1, { message: 'Subject is required' }),
  content: z.string().min(10, { message: 'Content must be at least 10 characters' }),
  content_type: z.enum(['html', 'text'], { message: 'Please select content type' }),
  check_spam_words: z.boolean().default(true),
  check_links: z.boolean().default(true),
  check_images: z.boolean().default(true),
})

const blacklistTestSchema = z.object({
  ip_addresses: z.string().min(1, { message: 'At least one IP address is required' }),
  check_reputation: z.boolean().default(true),
  include_details: z.boolean().default(true),
})

const headersTestSchema = z.object({
  headers: z.string().min(1, { message: 'Email headers are required' }),
  check_authentication: z.boolean().default(true),
  check_routing: z.boolean().default(true),
  check_security: z.boolean().default(true),
})

type SPFTestData = z.infer<typeof spfTestSchema>
type DomainTestData = z.infer<typeof domainTestSchema>
type EmailContentTestData = z.infer<typeof emailContentTestSchema>
type BlacklistTestData = z.infer<typeof blacklistTestSchema>
type HeadersTestData = z.infer<typeof headersTestSchema>

interface TestResult {
  success: boolean
  score: number
  details: Array<{
    test: string
    status: 'pass' | 'fail' | 'warning' | 'info'
    message: string
    recommendation?: string
  }>
}

interface SecurityTestingFormProps {
  onClose: () => void
}

export default function SecurityTestingForm({ onClose }: SecurityTestingFormProps) {
  const [activeTest, setActiveTest] = useState('spf')
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [runningTests, setRunningTests] = useState<Record<string, boolean>>({})

  const spfForm = useForm<SPFTestData>({
    resolver: zodResolver(spfTestSchema),
    defaultValues: {
      domain: '',
      expected_result: undefined,
    },
  })

  const domainForm = useForm<DomainTestData>({
    resolver: zodResolver(domainTestSchema),
    defaultValues: {
      domain: '',
      check_mx: true,
      check_dkim: true,
      check_dmarc: true,
      check_spf: true,
    },
  })

  const contentForm = useForm<EmailContentTestData>({
    resolver: zodResolver(emailContentTestSchema),
    defaultValues: {
      subject: '',
      content: '',
      content_type: 'html',
      check_spam_words: true,
      check_links: true,
      check_images: true,
    },
  })

  const blacklistForm = useForm<BlacklistTestData>({
    resolver: zodResolver(blacklistTestSchema),
    defaultValues: {
      ip_addresses: '',
      check_reputation: true,
      include_details: true,
    },
  })

  const headersForm = useForm<HeadersTestData>({
    resolver: zodResolver(headersTestSchema),
    defaultValues: {
      headers: '',
      check_authentication: true,
      check_routing: true,
      check_security: true,
    },
  })

  const runTest = async (testType: string, data: unknown) => {
    setRunningTests(prev => ({ ...prev, [testType]: true }))
    
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))
      
      // Generate mock results based on test type
      const mockResult = generateMockResult(testType, data)
      setTestResults(prev => ({ ...prev, [testType]: mockResult }))
      
      toast.success?.(`${testType.toUpperCase()} test completed`)
    } catch (error) {
      toast.error?.(`${testType.toUpperCase()} test failed`)
    } finally {
      setRunningTests(prev => ({ ...prev, [testType]: false }))
    }
  }

  const generateMockResult = (testType: string, data: unknown): TestResult => {
    const baseScore = Math.random() * 40 + 60 // Score between 60-100
    const tests = []

    switch (testType) {
      case 'spf':
        tests.push(
          { test: 'SPF Record Existence', status: 'pass' as const, message: 'SPF record found' },
          { test: 'SPF Syntax Validation', status: Math.random() > 0.2 ? 'pass' as const : 'warning' as const, message: 'SPF syntax is valid' },
          { test: 'Include Chain Length', status: 'pass' as const, message: 'Include chain within limits' },
          { test: 'DNS Lookup Count', status: Math.random() > 0.1 ? 'pass' as const : 'fail' as const, message: 'DNS lookups within RFC limits' }
        )
        break
      case 'domain':
        tests.push(
          { test: 'MX Record', status: data.check_mx ? 'pass' as const : 'info' as const, message: 'MX records configured correctly' },
          { test: 'DKIM Setup', status: data.check_dkim && Math.random() > 0.3 ? 'pass' as const : 'warning' as const, message: 'DKIM selector found' },
          { test: 'DMARC Policy', status: data.check_dmarc && Math.random() > 0.4 ? 'pass' as const : 'fail' as const, message: 'DMARC policy configured' },
          { test: 'Domain Reputation', status: Math.random() > 0.2 ? 'pass' as const : 'warning' as const, message: 'Domain has good reputation' }
        )
        break
      case 'content':
        tests.push(
          { test: 'Spam Word Analysis', status: Math.random() > 0.3 ? 'pass' as const : 'warning' as const, message: 'Low spam word count detected' },
          { test: 'Link Safety Check', status: Math.random() > 0.1 ? 'pass' as const : 'fail' as const, message: 'All links appear safe' },
          { test: 'Image Optimization', status: 'pass' as const, message: 'Images properly optimized' },
          { test: 'Content Structure', status: Math.random() > 0.2 ? 'pass' as const : 'warning' as const, message: 'Good HTML structure detected' }
        )
        break
      case 'blacklist':
        tests.push(
          { test: 'Spamhaus Check', status: Math.random() > 0.1 ? 'pass' as const : 'fail' as const, message: 'Not listed in Spamhaus' },
          { test: 'Barracuda Check', status: Math.random() > 0.15 ? 'pass' as const : 'fail' as const, message: 'Clean in Barracuda' },
          { test: 'SURBL Check', status: Math.random() > 0.2 ? 'pass' as const : 'warning' as const, message: 'No SURBL listing found' },
          { test: 'IP Reputation', status: Math.random() > 0.25 ? 'pass' as const : 'warning' as const, message: 'Good IP reputation score' }
        )
        break
      case 'headers':
        tests.push(
          { test: 'Authentication Headers', status: Math.random() > 0.2 ? 'pass' as const : 'warning' as const, message: 'Proper authentication headers present' },
          { test: 'Routing Information', status: 'pass' as const, message: 'Clean routing path detected' },
          { test: 'Security Headers', status: Math.random() > 0.3 ? 'pass' as const : 'warning' as const, message: 'Security headers configured' },
          { test: 'Header Consistency', status: Math.random() > 0.1 ? 'pass' as const : 'fail' as const, message: 'Headers are consistent' }
        )
        break
    }

    return {
      success: tests.every(t => t.status !== 'fail'),
      score: Math.round(baseScore),
      details: tests
    }
  }

  const getTestIcon = (testType: string) => {
    switch (testType) {
      case 'spf': return <Shield className="w-4 h-4" />
      case 'domain': return <Globe className="w-4 h-4" />
      case 'content': return <FileText className="w-4 h-4" />
      case 'blacklist': return <Target className="w-4 h-4" />
      case 'headers': return <Network className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'fail': return <XCircle className="w-4 h-4 text-red-600" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'info': return <Eye className="w-4 h-4 text-blue-600" />
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Security Testing Suite</h2>
          <p className="text-muted-foreground">
            Comprehensive security validation for email infrastructure and content
          </p>
        </div>
      </div>

      <Tabs value={activeTest} onValueChange={setActiveTest} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="spf" className="gap-2">
            {getTestIcon('spf')}
            SPF Test
          </TabsTrigger>
          <TabsTrigger value="domain" className="gap-2">
            {getTestIcon('domain')}
            Domain Test
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            {getTestIcon('content')}
            Content Test
          </TabsTrigger>
          <TabsTrigger value="blacklist" className="gap-2">
            {getTestIcon('blacklist')}
            Blacklist Test
          </TabsTrigger>
          <TabsTrigger value="headers" className="gap-2">
            {getTestIcon('headers')}
            Headers Test
          </TabsTrigger>
        </TabsList>

        {/* SPF Test */}
        <TabsContent value="spf" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                SPF Record Validation
              </CardTitle>
              <CardDescription>
                Test your domain's SPF (Sender Policy Framework) configuration for email authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...spfForm}>
                <form onSubmit={spfForm.handleSubmit((data) => runTest('spf', data))} className="space-y-4">
                  <FormField
                    control={spfForm.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain *</FormLabel>
                        <FormControl>
                          <Input placeholder="example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the domain you want to test for SPF records
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={spfForm.control}
                    name="expected_result"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Result (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select expected result" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pass">Pass</SelectItem>
                            <SelectItem value="fail">Fail</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                            <SelectItem value="softfail">Soft Fail</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Optional: Specify what you expect the SPF result to be
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={runningTests.spf} className="gap-2">
                    {runningTests.spf ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Run SPF Test
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Test */}
        <TabsContent value="domain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Domain Configuration Test
              </CardTitle>
              <CardDescription>
                Comprehensive test of your domain's email infrastructure configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...domainForm}>
                <form onSubmit={domainForm.handleSubmit((data) => runTest('domain', data))} className="space-y-4">
                  <FormField
                    control={domainForm.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain *</FormLabel>
                        <FormControl>
                          <Input placeholder="example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the domain to test email configuration
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={domainForm.control}
                      name="check_mx"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Check MX Records</FormLabel>
                            <FormDescription>
                              Validate mail exchange records
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={domainForm.control}
                      name="check_dkim"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Check DKIM</FormLabel>
                            <FormDescription>
                              Validate DKIM signatures
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={domainForm.control}
                      name="check_dmarc"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Check DMARC</FormLabel>
                            <FormDescription>
                              Validate DMARC policy
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={domainForm.control}
                      name="check_spf"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Check SPF</FormLabel>
                            <FormDescription>
                              Validate SPF records
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={runningTests.domain} className="gap-2">
                    {runningTests.domain ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Run Domain Test
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Test */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Email Content Security Test
              </CardTitle>
              <CardDescription>
                Analyze email content for spam indicators, security issues, and deliverability factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...contentForm}>
                <form onSubmit={contentForm.handleSubmit((data) => runTest('content', data))} className="space-y-4">
                  <FormField
                    control={contentForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your email subject line" {...field} />
                        </FormControl>
                        <FormDescription>
                          The subject line to analyze for spam indicators
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contentForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Content *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Paste your email content here..."
                            rows={8}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          The email content (HTML or text) to analyze
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contentForm.control}
                    name="content_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="html">HTML</SelectItem>
                            <SelectItem value="text">Plain Text</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Specify whether the content is HTML or plain text
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={runningTests.content} className="gap-2">
                    {runningTests.content ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Run Content Test
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blacklist Test */}
        <TabsContent value="blacklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                IP Blacklist Check
              </CardTitle>
              <CardDescription>
                Check if your IP addresses are listed on major email blacklists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...blacklistForm}>
                <form onSubmit={blacklistForm.handleSubmit((data) => runTest('blacklist', data))} className="space-y-4">
                  <FormField
                    control={blacklistForm.control}
                    name="ip_addresses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IP Addresses *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="192.168.1.1&#10;10.0.0.1&#10;203.0.113.1"
                            rows={5}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enter IP addresses to check (one per line)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={runningTests.blacklist} className="gap-2">
                    {runningTests.blacklist ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Run Blacklist Check
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Headers Test */}
        <TabsContent value="headers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-4 h-4" />
                Email Headers Analysis
              </CardTitle>
              <CardDescription>
                Analyze email headers for authentication, routing, and security indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...headersForm}>
                <form onSubmit={headersForm.handleSubmit((data) => runTest('headers', data))} className="space-y-4">
                  <FormField
                    control={headersForm.control}
                    name="headers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Headers *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Paste the complete email headers here..."
                            rows={10}
                            className="font-mono text-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Paste the raw email headers for analysis
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={runningTests.headers} className="gap-2">
                    {runningTests.headers ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Analyze Headers
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Security test results and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(testResults).map(([testType, result]) => (
              <div key={testType} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTestIcon(testType)}
                    <h4 className="font-semibold capitalize">{testType} Test</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} hover:bg-current`}
                    >
                      {result.success ? 'Passed' : 'Issues Found'}
                    </Badge>
                    <span className={`text-lg font-bold ${getScoreColor(result.score)}`}>
                      {result.score}/100
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {result.details.map((detail, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                      {getStatusIcon(detail.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{detail.test}</span>
                          <Badge variant="outline" className="text-xs">
                            {detail.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {detail.message}
                        </p>
                        {detail.recommendation && (
                          <Alert className="mt-2">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription>
                              <strong>Recommendation:</strong> {detail.recommendation}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {testType !== Object.keys(testResults)[Object.keys(testResults).length - 1] && (
                  <Separator />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}