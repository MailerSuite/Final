/**
 * Plan Status Widget - Shows current plan, usage, and upgrade options
 * Integrates with the plan enforcement system
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { usePlan } from '../../hooks/usePlan';
import { Crown, Zap, Server, Users, Star, ExternalLink, RefreshCw } from 'lucide-react';

interface PlanStatusWidgetProps {
  className?: string;
  showUpgradeButton?: boolean;
}

export const PlanStatusWidget: React.FC<PlanStatusWidgetProps> = ({ 
  className,
  showUpgradeButton = true 
}) => {
  const {
    formattedStatus,
    loading,
    error,
    refreshPlanStatus,
    isBasicPlan,
    isPremiumPlan,
    isDeluxePlan,
    isTeamPlan,
    isLifetimePlan,
    hasSocksStream,
    hasPremiumSupport
  } = usePlan();

  const getPlanIcon = () => {
    if (isLifetimePlan) return <Star className="h-4 w-4 text-yellow-500" />;
    if (isTeamPlan) return <Users className="h-4 w-4 text-purple-500" />;
    if (isDeluxePlan) return <Crown className="h-4 w-4 text-purple-500" />;
    if (isPremiumPlan) return <Zap className="h-4 w-4 text-blue-500" />;
    return <Server className="h-4 w-4 text-green-500" />;
  };

  const getPlanColor = () => {
    if (isLifetimePlan) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (isTeamPlan) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (isDeluxePlan) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (isPremiumPlan) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getUpgradeText = () => {
    if (isBasicPlan) return 'Upgrade to Premium';
    if (isPremiumPlan) return 'Upgrade to Deluxe';
    return 'View Plans';
  };

  if (loading) {
    return (
      <Card className={`h-full ${className}`}>
        <CardHeader className="p-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4 p-6 pt-0">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`h-full ${className}`}>
        <CardHeader className="p-6">
          <CardTitle className="text-red-600">Error</CardTitle>
          <CardDescription>Failed to load plan status</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshPlanStatus}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!formattedStatus) return null;

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getPlanIcon()}
            <CardTitle className="text-lg">{formattedStatus.planName} Plan</CardTitle>
          </div>
          <Badge variant="outline" className={getPlanColor()}>
            {formattedStatus.tierDisplay}
          </Badge>
        </div>
        <CardDescription>
          {formattedStatus.threadsDisplay} • {formattedStatus.aiCallsDisplay}
        </CardDescription>
              </CardHeader>

      <CardContent className="space-y-4 p-6 pt-0">
        {/* AI Usage Progress */}
        {formattedStatus.aiUsagePercent > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">AI Usage Today</span>
              <span className="font-medium">{formattedStatus.aiUsagePercent}%</span>
            </div>
            <Progress 
              value={formattedStatus.aiUsagePercent} 
              className="h-2"
              color={formattedStatus.aiUsagePercent > 80 ? 'red' : 'blue'}
            />
          </div>
        )}

        {/* Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Features</h4>
          <div className="flex flex-wrap gap-1">
            {hasSocksStream && (
              <Badge variant="secondary" className="text-xs">
                SOCKS STREAM
              </Badge>
            )}
            {hasPremiumSupport && (
              <Badge variant="secondary" className="text-xs">
                Premium Support
              </Badge>
            )}
            {formattedStatus.features.includes('early_access') && (
              <Badge variant="secondary" className="text-xs">
                Early Access
              </Badge>
            )}
            {formattedStatus.features.includes('beta_features') && (
              <Badge variant="secondary" className="text-xs">
                Beta Features
              </Badge>
            )}
            {formattedStatus.features.includes('team_management') && (
              <Badge variant="secondary" className="text-xs">
                Team Management
              </Badge>
            )}
            {formattedStatus.features.length === 1 && formattedStatus.features[0] === 'basic_features' && (
              <Badge variant="outline" className="text-xs">
                Basic Features
              </Badge>
            )}
          </div>
        </div>

        {/* Upgrade CTA */}
        {showUpgradeButton && !isLifetimePlan && (
          <div className="pt-2">
            <Button 
              variant="default"
              size="sm" 
              className="w-full"
              onClick={() => window.open('/pricing', '_blank')}
            >
              {getUpgradeText()}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Plan Limits Warning */}
        {formattedStatus.aiUsagePercent > 90 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ You're approaching your AI usage limit. Consider upgrading to avoid interruptions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 