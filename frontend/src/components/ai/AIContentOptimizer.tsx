/**
 * AI Content Optimizer Component
 * Provides AI-powered email content optimization and analysis
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Brain, Target, TrendingUp, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { aiMailingApi, ContentOptimizationRequest } from '@/api/ai-mailing-api'

interface AIContentOptimizerProps {
  initialSubject?: string
  initialContent?: string
  onContentUpdate?: (subject: string, content: string) => void
  className?: string
}

export const AIContentOptimizer: React.FC<AIContentOptimizerProps> = ({
  initialSubject = '',
  initialContent = '',
  onContentUpdate,
  className = ''
}) => {
  const [subject, setSubject] = useState(initialSubject)
  const [content, setContent] = useState(initialContent)
  const [targetAudience, setTargetAudience] = useState('')
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['increase_opens', 'improve_clicks'])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [activeTab, setActiveTab] = useState('optimize')

  const optimizationGoals = [
    { value: 'increase_opens', label: 'Increase Open Rates', icon: TrendingUp },
    { value: 'improve_clicks', label: 'Improve Click-Through', icon: Target },
    { value: 'reduce_unsubscribes', label: 'Reduce Unsubscribes', icon: CheckCircle },
    { value: 'boost_engagement', label: 'Boost Engagement', icon: Zap },
    { value: 'improve_deliverability', label: 'Improve Deliverability', icon: AlertCircle }
  ]

  const audienceTypes = [
    { value: '', label: 'General Audience' },
    { value: 'existing_customers', label: 'Existing Customers' },
    { value: 'new_leads', label: 'New Leads' },
    { value: 'inactive_subscribers', label: 'Inactive Subscribers' },
    { value: 'high_value_customers', label: 'High-Value Customers' },
    { value: 'recent_purchasers', label: 'Recent Purchasers' },
    { value: 'trial_users', label: 'Trial Users' },
    { value: 'enterprise_clients', label: 'Enterprise Clients' }
  ]

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    )
  }

  const optimizeContent = async () => {
    if (!subject.trim() || !content.trim()) {
      toast({
        title: "Content Required",
        description: "Please provide both subject line and email content to optimize.",
        variant: "destructive"
      })
      return
    }

    if (selectedGoals.length === 0) {
      toast({
        title: "Goals Required",
        description: "Please select at least one optimization goal.",
        variant: "destructive"
      })
      return
    }

    setIsOptimizing(true)
    try {
      const request: ContentOptimizationRequest = {
        subject,
        content,
        target_audience: targetAudience || undefined,
        goals: selectedGoals
      }

      const response = await aiMailingApi.optimizeContent(request)

      if (response.success && response.analysis) {
        setAnalysis(response.analysis)
        setActiveTab('results')
        toast({
          title: "Content Optimized!",
          description: "AI analysis complete. Check the results tab for recommendations."
        })
      } else {
        throw new Error(response.error || 'Failed to optimize content')
      }
    } catch (error: unknown) {
      console.error('Error optimizing content:', error)
      
      if (error.response?.status === 429) {
        toast({
          title: "Quota Exceeded",
          description: "You've reached your AI usage limit. Please upgrade your plan.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Optimization Failed",
          description: error.message || "Failed to optimize content. Please try again.",
          variant: "destructive"
        })
      }
    } finally {
      setIsOptimizing(false)
    }
  }

  const applyChanges = () => {
    if (onContentUpdate) {
      onContentUpdate(subject, content)
      toast({
        title: "Changes Applied",
        description: "Content updates have been applied to your email."
      })
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          AI Content Optimizer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="optimize">Optimize</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="optimize" className="space-y-4">
            {/* Email Content Input */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject Line</label>
                <Textarea
                  placeholder="Enter your email subject line..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Email Content</label>
                <Textarea
                  placeholder="Enter your email content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Target Audience</label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {audienceTypes.map((audience) => (
                      <SelectItem key={audience.value} value={audience.value}>
                        {audience.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Optimization Goals */}
              <div>
                <label className="text-sm font-medium mb-2 block">Optimization Goals</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {optimizationGoals.map((goal) => {
                    const Icon = goal.icon
                    const isSelected = selectedGoals.includes(goal.value)
                    return (
                      <Button
                        key={goal.value}
                        variant={isSelected ? "primary" : "outline"}
                        size="sm"
                        onClick={() => toggleGoal(goal.value)}
                        className="justify-start"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {goal.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Optimize Button */}
              <Button
                onClick={optimizeContent}
                disabled={isOptimizing || !subject.trim() || !content.trim()}
                className="w-full"
                size="lg"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing & Optimizing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Optimize with AI
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {analysis ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">AI Analysis & Recommendations</h3>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {analysis}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={applyChanges} disabled={!onContentUpdate}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Apply Recommendations
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('optimize')}>
                    Make Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>No analysis available yet.</p>
                <p className="text-sm">Switch to the Optimize tab to analyze your content.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default AIContentOptimizer 