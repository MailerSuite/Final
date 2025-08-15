import React, { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { 
  Cpu, 
  Settings, 
  Zap, 
  Timer, 
  Activity, 
  RefreshCw, 
  AlertTriangle, 
  Info,
  TrendingUp,
  Clock
} from 'lucide-react'
import { toast } from '@/hooks/useToast'

const threadPoolFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }).max(100, { message: 'Name must be less than 100 characters' }),
  priority: z.enum(['high', 'normal', 'low'], { message: 'Please select a priority level' }),
  max_connections: z.number().min(1, { message: 'Must have at least 1 connection' }).max(100, { message: 'Cannot exceed 100 connections' }),
  delay_ms: z.number().min(0, { message: 'Delay cannot be negative' }).max(60000, { message: 'Delay cannot exceed 60 seconds' }),
  enabled: z.boolean().default(true),
})

type ThreadPoolFormData = z.infer<typeof threadPoolFormSchema>

interface ThreadPoolFormProps {
  threadPool?: Partial<ThreadPoolFormData & { id: string }>
  onSubmit: (data: ThreadPoolFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

export default function ThreadPoolForm({ 
  threadPool, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  mode = 'create' 
}: ThreadPoolFormProps) {
  const [testResult, setTestResult] = useState<{ performance: number; latency: number } | null>(null)
  const [testing, setTesting] = useState(false)

  const form = useForm<ThreadPoolFormData>({
    resolver: zodResolver(threadPoolFormSchema),
    defaultValues: {
      name: threadPool?.name || '',
      priority: threadPool?.priority || 'normal',
      max_connections: threadPool?.max_connections || 10,
      delay_ms: threadPool?.delay_ms || 0,
      enabled: threadPool?.enabled ?? true,
    },
  })

  const watchedValues = form.watch()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 hover:bg-red-100'
      case 'normal': return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'low': return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  const getPerformanceEstimate = () => {
    const { max_connections, delay_ms, priority } = watchedValues
    const baseScore = max_connections * (priority === 'high' ? 1.2 : priority === 'normal' ? 1 : 0.8)
    const delayPenalty = delay_ms / 1000 * 0.1
    return Math.max(1, Math.min(100, Math.round(baseScore - delayPenalty)))
  }

  const getRecommendations = () => {
    const { max_connections, delay_ms, priority } = watchedValues
    const recommendations = []

    if (max_connections < 5) {
      recommendations.push({
        type: 'warning',
        message: 'Low connection count may limit throughput for high-volume operations'
      })
    }

    if (max_connections > 50) {
      recommendations.push({
        type: 'info',
        message: 'High connection count may increase resource usage'
      })
    }

    if (delay_ms > 5000) {
      recommendations.push({
        type: 'warning',
        message: 'High delay may significantly impact performance'
      })
    }

    if (priority === 'high' && max_connections < 10) {
      recommendations.push({
        type: 'info',
        message: 'Consider increasing connections for high-priority pools'
      })
    }

    return recommendations
  }

  const testConfiguration = async () => {
    setTesting(true)
    try {
      // Mock performance test - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const performance = getPerformanceEstimate()
      const latency = Math.random() * 100 + watchedValues.delay_ms / 10
      
      setTestResult({ performance, latency: Math.round(latency) })
      toast.success?.('Configuration test completed')
    } catch (error) {
      toast.error?.('Configuration test failed')
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (data: ThreadPoolFormData) => {
    try {
      await onSubmit(data)
      toast.success?.(mode === 'create' ? 'Thread pool created successfully' : 'Thread pool updated successfully')
    } catch (error) {
      toast.error?.(`Failed to ${mode} thread pool`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Cpu className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">
            {mode === 'create' ? 'Create Thread Pool' : 'Edit Thread Pool'}
          </h2>
          <p className="text-muted-foreground">
            {mode === 'create' 
              ? 'Configure a new thread pool for optimized resource management'
              : 'Update thread pool configuration and performance settings'
            }
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Basic Configuration
              </CardTitle>
              <CardDescription>
                Configure the thread pool name and operational settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pool Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., High-Performance SMTP Pool" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      A descriptive name to identify this thread pool
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority Level *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-red-600" />
                            <span>High Priority</span>
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">Critical</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="normal">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-600" />
                            <span>Normal Priority</span>
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">Standard</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span>Low Priority</span>
                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 text-xs">Background</Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Higher priority pools get preferential resource allocation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Thread Pool</FormLabel>
                      <FormDescription>
                        When disabled, this pool won't accept new tasks
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Performance Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Performance Configuration
              </CardTitle>
              <CardDescription>
                Configure connection limits and timing parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="max_connections"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Connections</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[field.value]}
                            onValueChange={(values) => field.onChange(values[0])}
                            max={100}
                            min={1}
                            step={1}
                            className="flex-1"
                          />
                          <div className="w-16 text-right">
                            <Badge variant="outline" className="text-sm font-mono">
                              {field.value}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1 (Minimal)</span>
                          <span>50 (Balanced)</span>
                          <span>100 (Maximum)</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Maximum concurrent connections this pool can handle (1-100)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delay_ms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delay Between Operations (ms)</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[field.value]}
                            onValueChange={(values) => field.onChange(values[0])}
                            max={10000}
                            min={0}
                            step={100}
                            className="flex-1"
                          />
                          <div className="w-20 text-right">
                            <Badge variant="outline" className="text-sm font-mono">
                              {field.value}ms
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0ms (No delay)</span>
                          <span>1000ms (1 second)</span>
                          <span>10s (Maximum)</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Delay between operations to control rate limiting (0-60000ms)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Performance Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Performance Preview
              </CardTitle>
              <CardDescription>
                Estimated performance characteristics based on current configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Performance Score</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {getPerformanceEstimate()}/100
                  </div>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Est. Throughput</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(watchedValues.max_connections * 60 / (1 + watchedValues.delay_ms / 1000))}/min
                  </div>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getPriorityColor(watchedValues.priority)}>
                      {watchedValues.priority.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">Priority</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {watchedValues.priority === 'high' && 'Critical operations'}
                    {watchedValues.priority === 'normal' && 'Standard operations'}
                    {watchedValues.priority === 'low' && 'Background tasks'}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {getRecommendations().length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recommendations</h4>
                  {getRecommendations().map((rec, index) => (
                    <Alert key={index} className={rec.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}>
                      <AlertTriangle className={`w-4 h-4 ${rec.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`} />
                      <AlertDescription className={rec.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'}>
                        {rec.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Test Configuration */}
              <div className="flex items-center gap-3 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={testConfiguration}
                  disabled={testing}
                  className="gap-2"
                >
                  {testing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                  Test Configuration
                </Button>
                
                {testResult && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Test Results:</span>
                    <Badge variant="outline">Performance: {testResult.performance}%</Badge>
                    <Badge variant="outline">Latency: {testResult.latency}ms</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : mode === 'create' ? (
                <>Create Thread Pool</>
              ) : (
                <>Update Thread Pool</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}