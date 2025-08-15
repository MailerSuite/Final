import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { securityApi, type CampaignValidationRequest, type CampaignValidationResponse } from '@/api/security-api';
import { toast } from '@/hooks/smtp-checker/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface CampaignSecurityValidationProps {
  campaignData: CampaignValidationRequest;
  onValidationComplete?: (result: CampaignValidationResponse) => void;
  className?: string;
}

export const CampaignSecurityValidation: React.FC<CampaignSecurityValidationProps> = ({
  campaignData,
  onValidationComplete,
  className
}) => {
  const [validationResult, setValidationResult] = useState<CampaignValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runValidation = async () => {
    if (!campaignData.sender_email || !campaignData.subject) {
      toast({
        description: 'Sender email and subject are required for security validation',
        severity: 'critical'
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await securityApi.validateCampaign(campaignData);
      setValidationResult(result);
      
      if (onValidationComplete) {
        onValidationComplete(result);
      }

      if (result.success && result.validation) {
        const status = result.validation.overall_status;
        if (status === 'approved') {
          toast({
            description: `Security validation passed with score: ${result.validation.security_score}/100`,
            severity: 'success'
          });
        } else if (status === 'review_required') {
          toast({
            description: 'Security validation requires review. Check recommendations.',
            severity: 'warning'
          });
        } else {
          toast({
            description: 'Security validation failed. Please address the issues.',
            severity: 'critical'
          });
        }
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Security validation failed';
      setError(message);
      toast({
        description: message,
        severity: 'critical'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'review_required':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'border-green-200 bg-green-50';
      case 'review_required':
        return 'border-yellow-200 bg-yellow-50';
      case 'rejected':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-border bg-muted';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-accent" />
            <CardTitle>Security Validation</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runValidation}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Validating...' : 'Run Security Check'}
          </Button>
        </div>
        <CardDescription>
          Validate campaign against SPF records, content scanning, and blacklists
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Validation Error</AlertTitle>
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {validationResult?.success && validationResult.validation && (
          <div className="space-y-4">
            {/* Overall Status */}
            <Alert className={getStatusColor(validationResult.validation.overall_status)}>
              <div className="flex items-center space-x-2">
                {getStatusIcon(validationResult.validation.overall_status)}
                <AlertTitle className="text-sm font-medium">
                  Status: {validationResult.validation.overall_status.replace('_', ' ').toUpperCase()}
                </AlertTitle>
              </div>
              <AlertDescription className="mt-2">
                <div className="flex items-center justify-between">
                  <span>Security Score:</span>
                  <Badge
                    variant="outline"
                    className={`${getScoreColor(validationResult.validation.security_score)} border-current`}
                  >
                    {validationResult.validation.security_score}/100
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>

            {/* Validation Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SPF Validation */}
              {validationResult.validation.validations.spf && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">SPF Record</span>
                    <Badge
                      variant={validationResult.validation.validations.spf.valid ? "success" : "destructive"}
                      className="text-xs"
                    >
                      {validationResult.validation.validations.spf.valid ? "Valid" : "Invalid"}
                    </Badge>
                  </div>
                  {validationResult.validation.validations.spf.error && (
                    <p className="text-xs text-red-600">
                      {validationResult.validation.validations.spf.error}
                    </p>
                  )}
                </div>
              )}

              {/* Content Scan */}
              {validationResult.validation.validations.content && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Content Scan</span>
                    <Badge
                      variant={validationResult.validation.validations.content.is_spam ? "destructive" : "success"}
                      className="text-xs"
                    >
                      {validationResult.validation.validations.content.is_spam ? "Spam Detected" : "Clean"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Risk Level:</span>
                    <span className={
                      validationResult.validation.validations.content.risk_level === 'high' ? 'text-red-600' :
                      validationResult.validation.validations.content.risk_level === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }>
                      {validationResult.validation.validations.content.risk_level}
                    </span>
                  </div>
                </div>
              )}

              {/* Blacklist Check */}
              {validationResult.validation.validations.blacklist && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Blacklist</span>
                    <Badge
                      variant={validationResult.validation.validations.blacklist.summary?.blacklisted_count > 0 ? "destructive" : "success"}
                      className="text-xs"
                    >
                      {validationResult.validation.validations.blacklist.summary?.blacklisted_count > 0 ? "Listed" : "Clean"}
                    </Badge>
                  </div>
                  {validationResult.validation.validations.blacklist.summary && (
                    <p className="text-xs text-muted-foreground">
                      {validationResult.validation.validations.blacklist.summary.blacklisted_count} of{' '}
                      {validationResult.validation.validations.blacklist.summary.total_checked} providers
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Recommendations */}
            {validationResult.validation.recommendations.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Recommendations</AlertTitle>
                <AlertDescription className="text-blue-700">
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {validationResult.validation.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!loading && !validationResult && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Run Security Check" to validate your campaign</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 