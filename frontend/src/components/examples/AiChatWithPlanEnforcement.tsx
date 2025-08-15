/**
 * AI Chat Component with Plan Enforcement
 * Example of integrating plan enforcement into an AI feature
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { withPlanEnforcement, PlanEnforcementPresets, WithPlanEnforcementProps } from '../plan/withPlanEnforcement';
import { usePlan } from '../../hooks/usePlan';
import { planService } from '../../services/plan-service';
import { Loader2, Send, Zap, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/useToast';

interface AiChatProps extends WithPlanEnforcementProps {
  className?: string;
}

const AiChatComponent: React.FC<AiChatProps> = ({ 
  className,
  planEnforcement 
}) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { 
    userPlan,
    hasFeature,
    upgradeInfo,
    usageWarnings,
    isLoading: planLoading,
    error: planError
  } = usePlan();

  // Calculate AI usage information from user plan
  const getAiUsageInfo = useCallback(() => {
    if (!userPlan) return null;
    
    const aiCallsUsed = userPlan.usage?.aiCallsDaily || 0;
    const aiCallsLimit = userPlan.limits?.maxAiCallsDaily || 0;
    const usagePercent = aiCallsLimit > 0 ? Math.round((aiCallsUsed / aiCallsLimit) * 100) : 0;
    
    return {
      aiCallsUsed,
      aiCallsLimit,
      usagePercent,
      aiCallsDisplay: `${aiCallsUsed}/${aiCallsLimit} calls today`,
      hasAiAccess: hasFeature('ai_assistant') && usagePercent < 100
    };
  }, [userPlan, hasFeature]);

  const aiUsageInfo = getAiUsageInfo();

  const checkAiQuota = useCallback(async (estimatedTokens: number) => {
    if (!aiUsageInfo) {
      return { allowed: false, reason: 'Plan information unavailable' };
    }

    if (!aiUsageInfo.hasAiAccess) {
      return { 
        allowed: false, 
        reason: 'AI feature not available on your plan or quota exceeded',
        upgradeRequired: true
      };
    }

    return { allowed: true };
  }, [aiUsageInfo]);

  const showUpgradePrompt = useCallback((quotaCheck: any) => {
    toast({ 
      description: quotaCheck.reason || 'Upgrade required for AI features', 
      severity: "warning" 
    });
  }, []);

  const estimateTokens = useCallback((text: string): number => {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      // Check quota before making request
      const estimatedTokens = estimateTokens(prompt);
      const quotaCheck = await checkAiQuota(estimatedTokens);
      
      if (!quotaCheck.allowed) {
        showUpgradePrompt(quotaCheck);
        setLoading(false);
        return;
      }

      // Make AI request
      const result = await planService.createAiChat(prompt);
      
      if (result.success && result.data) {
        setResponse(result.data.response);
        setPrompt('');
        
        // Refresh plan status to update usage counters
        if (planEnforcement?.refreshEnforcement) {
          planEnforcement.refreshEnforcement();
        }
      } else {
        setError(result.message || 'Failed to generate AI response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const canUseAI = aiUsageInfo?.hasAiAccess;
  const isNearLimit = aiUsageInfo?.usagePercent !== undefined && aiUsageInfo.usagePercent > 80;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <span>AI Assistant</span>
          </CardTitle>
          
          {aiUsageInfo && (
            <Badge variant={isNearLimit ? "destructive" : "secondary"}>
              {aiUsageInfo.aiCallsDisplay}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Plan warning banner */}
        {planEnforcement?.hasWarning && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              {planEnforcement.warningMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Usage warning */}
        {isNearLimit && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              You're approaching your daily AI limit. Consider upgrading to avoid interruptions.
            </AlertDescription>
          </Alert>
        )}

        {/* AI Response */}
        {response && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="text-sm font-medium text-foreground mb-2">AI Response:</h4>
            <p className="text-foreground whitespace-pre-wrap">{response}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Chat Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask me anything..."
              rows={3}
              disabled={loading || !canUseAI}
              className="resize-none"
            />
            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
              <span>Est. tokens: {estimateTokens(prompt)}</span>
              <span>{prompt.length}/1000 characters</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {aiUsageInfo?.usagePercent !== undefined && (
                <span>
                  Usage: {aiUsageInfo.usagePercent}% of daily limit
                </span>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={loading || !prompt.trim() || !canUseAI}
              className="min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Plan upgrade prompt for quota exceeded */}
        {!canUseAI && aiUsageInfo?.usagePercent === 100 && (
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 font-medium mb-3">
              You've hit your AI limit for this period.
            </p>
            <Button 
              onClick={() => window.open('/pricing', '_blank')}
              variant="primary"
            >
              Upgrade for More AI Calls
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Wrap component with plan enforcement
export const AiChatWithPlanEnforcement = withPlanEnforcement(
  AiChatComponent,
  PlanEnforcementPresets.aiFeature(100) // Require ~100 tokens for basic check
); 