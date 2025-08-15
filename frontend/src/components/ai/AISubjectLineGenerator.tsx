/**
 * AI Subject Line Generator Component
 * Can be integrated into campaign creation, template editing, and compose pages
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, Copy, Check, RefreshCw } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { aiMailingApi, SubjectLineRequest } from '@/api/ai-mailing-api'

interface SubjectLineOption {
  subject: string
  score: number
  reason: string
}

interface AISubjectLineGeneratorProps {
  emailContent: string
  onSubjectSelect?: (subject: string) => void
  initialCampaignType?: string
  initialIndustry?: string
  className?: string
}

export const AISubjectLineGenerator: React.FC<AISubjectLineGeneratorProps> = ({
  emailContent,
  onSubjectSelect,
  initialCampaignType = 'promotional',
  initialIndustry = '',
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [subjectLines, setSubjectLines] = useState<SubjectLineOption[]>([])
  const [campaignType, setCampaignType] = useState(initialCampaignType)
  const [industry, setIndustry] = useState(initialIndustry)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const campaignTypes = [
    { value: 'promotional', label: 'Promotional' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'transactional', label: 'Transactional' },
    { value: 'welcome', label: 'Welcome Series' },
    { value: 'abandoned_cart', label: 'Abandoned Cart' },
    { value: 're_engagement', label: 'Re-engagement' },
    { value: 'announcement', label: 'Announcement' }
  ]

  const industries = [
    { value: '', label: 'General' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'saas', label: 'SaaS' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'finance', label: 'Finance' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'nonprofit', label: 'Non-profit' },
    { value: 'retail', label: 'Retail' },
    { value: 'travel', label: 'Travel' }
  ]

  const generateSubjectLines = async () => {
    if (!emailContent.trim()) {
      toast({
        title: "Content Required",
        description: "Please provide email content to generate subject lines.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const request: SubjectLineRequest = {
        email_content: emailContent,
        campaign_type: campaignType,
        industry: industry || undefined,
        count: 5
      }

      const response = await aiMailingApi.generateSubjectLines(request)

      if (response.success && response.subject_lines) {
        setSubjectLines(response.subject_lines)
        toast({
          title: "Subject Lines Generated!",
          description: `Generated ${response.subject_lines.length} optimized subject lines.`
        })
      } else {
        throw new Error(response.error || 'Failed to generate subject lines')
      }
    } catch (error: unknown) {
      console.error('Error generating subject lines:', error)
      
      if (error.response?.status === 429) {
        toast({
          title: "Quota Exceeded",
          description: "You've reached your AI usage limit. Please upgrade your plan.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Generation Failed",
          description: error.message || "Failed to generate subject lines. Please try again.",
          variant: "destructive"
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (subject: string, index: number) => {
    try {
      await navigator.clipboard.writeText(subject)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
      toast({
        title: "Copied!",
        description: "Subject line copied to clipboard."
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      })
    }
  }

  const selectSubject = (subject: string) => {
    if (onSubjectSelect) {
      onSubjectSelect(subject)
      toast({
        title: "Subject Selected",
        description: "Subject line applied to your email."
      })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Subject Line Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Campaign Type</label>
            <Select value={campaignType} onValueChange={setCampaignType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {campaignTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Industry</label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {industries.map((ind) => (
                  <SelectItem key={ind.value} value={ind.value}>
                    {ind.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateSubjectLines}
          disabled={isGenerating || !emailContent.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Subject Lines...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Subject Lines
            </>
          )}
        </Button>

        {/* Generated Subject Lines */}
        {subjectLines.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Generated Subject Lines:</h4>
            {subjectLines.map((option, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getScoreColor(option.score)}>
                    Score: {option.score}/100
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(option.subject, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    {onSubjectSelect && (
                      <Button
                        size="sm"
                        onClick={() => selectSubject(option.subject)}
                      >
                        Use This
                      </Button>
                    )}
                  </div>
                </div>
                <p className="font-medium text-sm mb-1">{option.subject}</p>
                <p className="text-xs text-muted-foreground">{option.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* Regenerate Button */}
        {subjectLines.length > 0 && (
          <Button
            variant="outline"
            onClick={generateSubjectLines}
            disabled={isGenerating}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate More Options
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default AISubjectLineGenerator 