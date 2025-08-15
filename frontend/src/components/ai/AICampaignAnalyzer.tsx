/**
 * AI Campaign Analyzer Component
 * Provides AI-powered campaign performance analysis and recommendations
 */

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Loader2, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  Eye, 
  MousePointer, 
  UserMinus,
  AlertTriangle,
  CheckCircle,
  Lightbulb
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { aiMailingApi, CampaignAnalysisRequest } from '@/api/ai-mailing-api'

interface PerformanceData {
  campaign_name: string
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  delivery_rate: number
  open_rate: number
  click_rate: number
  unsubscribe_rate: number
  bounce_rate: number
}

interface AICampaignAnalyzerProps {
  campaignId?: string
  performanceData?: PerformanceData
  className?: string
}

export const AICampaignAnalyzer: React.FC<AICampaignAnalyzerProps> = ({
  campaignId,
  performanceData,
  className = ''
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignId || '')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [analysisData, setAnalysisData] = useState<PerformanceData | null>(null)
  const [activeTab, setActiveTab] = useState('metrics')
  const [campaigns, setCampaigns] = useState<Array<{id: string, name: string}>>([])

  // Mock campaign data - replace with actual API call
  useEffect(() => {
    // Load available campaigns
    setCampaigns([
      { id: '1', name: 'Black Friday Sale 2024' },
      { id: '2', name: 'Welcome Series - Week 1' },
      { id: '3', name: 'Product Launch Newsletter' },
      { id: '4', name: 'Re-engagement Campaign' },
      { id: '5', name: 'Holiday Special Offer' }
    ])
  }, [])

  const analyzeCampaign = async () => {
    if (!selectedCampaignId) {
      toast({
        title: "Campaign Required",
        description: "Please select a campaign to analyze.",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const request: CampaignAnalysisRequest = {
        campaign_id: selectedCampaignId,
        include_recommendations: true
      }

      const response = await aiMailingApi.analyzeCampaign(request)

      if (response.success && response.analysis) {
        setAnalysis(response.analysis)
        setAnalysisData(response.performance_data)
        setActiveTab('analysis')
        toast({
          title: "Analysis Complete!",
          description: "AI has analyzed your campaign performance."
        })
      } else {
        throw new Error(response.error || 'Failed to analyze campaign')
      }
    } catch (error: any) {
      console.error('Error analyzing campaign:', error)
      
      if (error.response?.status === 429) {
        toast({
          title: "Quota Exceeded",
          description: "You've reached your AI usage limit. Please upgrade your plan.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Analysis Failed",
          description: error.message || "Failed to analyze campaign. Please try again.",
          variant: "destructive"
        })
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getPerformanceColor = (rate: number, type: 'good' | 'bad') => {
    if (type === 'good') {
      if (rate >= 25) return 'text-green-600'
      if (rate >= 15) return 'text-yellow-600'
      return 'text-red-600'
    } else {
      if (rate <= 2) return 'text-green-600'
      if (rate <= 5) return 'text-yellow-600'
      return 'text-red-600'
    }
  }

  const getPerformanceBadge = (rate: number, type: 'good' | 'bad') => {
    if (type === 'good') {
      if (rate >= 25) return { variant: 'default' as const, text: 'Excellent' }
      if (rate >= 15) return { variant: 'secondary' as const, text: 'Good' }
      return { variant: 'destructive' as const, text: 'Needs Improvement' }
    } else {
      if (rate <= 2) return { variant: 'default' as const, text: 'Excellent' }
      if (rate <= 5) return { variant: 'secondary' as const, text: 'Acceptable' }
      return { variant: 'destructive' as const, text: 'High' }
    }
  }

  const dataToDisplay = analysisData || performanceData

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          AI Campaign Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            {/* Campaign Selection */}
            {!campaignId && (
              <div>
                <label className="text-sm font-medium mb-2 block">Select Campaign</label>
                <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a campaign to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Performance Metrics */}
            {dataToDisplay && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{dataToDisplay.campaign_name}</h3>
                
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Sent</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {dataToDisplay.total_sent.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Opened</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {dataToDisplay.total_opened.toLocaleString()}
                    </div>
                    <div className={`text-sm ${getPerformanceColor(dataToDisplay.open_rate, 'good')}`}>
                      {dataToDisplay.open_rate.toFixed(1)}%
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MousePointer className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Clicked</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {dataToDisplay.total_clicked.toLocaleString()}
                    </div>
                    <div className={`text-sm ${getPerformanceColor(dataToDisplay.click_rate, 'good')}`}>
                      {dataToDisplay.click_rate.toFixed(1)}%
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <UserMinus className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Unsubscribed</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {dataToDisplay.unsubscribe_rate.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Performance Bars */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Delivery Rate</span>
                      <Badge {...getPerformanceBadge(dataToDisplay.delivery_rate, 'good')}>
                        {dataToDisplay.delivery_rate.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={dataToDisplay.delivery_rate} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Open Rate</span>
                      <Badge {...getPerformanceBadge(dataToDisplay.open_rate, 'good')}>
                        {dataToDisplay.open_rate.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={dataToDisplay.open_rate} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Click Rate</span>
                      <Badge {...getPerformanceBadge(dataToDisplay.click_rate, 'good')}>
                        {dataToDisplay.click_rate.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={dataToDisplay.click_rate} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Bounce Rate</span>
                      <Badge {...getPerformanceBadge(dataToDisplay.bounce_rate, 'bad')}>
                        {dataToDisplay.bounce_rate.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={dataToDisplay.bounce_rate} className="h-2" />
                  </div>
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <Button
              onClick={analyzeCampaign}
              disabled={isAnalyzing || !selectedCampaignId}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Campaign...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {analysis ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold">AI Performance Analysis</h3>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {analysis}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActiveTab('metrics')}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Metrics
                  </Button>
                  <Button onClick={analyzeCampaign} disabled={isAnalyzing}>
                    <Loader2 className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    Re-analyze
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>No analysis available yet.</p>
                <p className="text-sm">Switch to the Metrics tab to start your analysis.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default AICampaignAnalyzer 