import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw, Mail } from 'lucide-react';
import { securityApi, type SPFValidationRequest, type SPFValidationResponse } from '@/api/security-api';
import { toast } from '@/hooks/smtp-checker/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface SMTPSecurityValidationProps {
  senderEmail?: string;
  senderIP?: string;
  onValidationComplete?: (result: SPFValidationResponse) => void;
  className?: string;
}

export const SMTPSecurityValidation: React.FC<SMTPSecurityValidationProps> = ({
  senderEmail: initialEmail = '',
  senderIP: initialIP = '',
  onValidationComplete,
  className
}) => {
  const [senderEmail, setSenderEmail] = useState(initialEmail);
  const [senderIP, setSenderIP] = useState(initialIP);
  const [validationResult, setValidationResult] = useState<SPFValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSPFValidation = async () => {
    if (!senderEmail.trim() || !senderIP.trim()) {
      toast({
        description: 'Both sender email and IP address are required for SPF validation',
        severity: 'critical'
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      toast({
        description: 'Please enter a valid email address',
        severity: 'critical'
      });
      return;
    }

    // Basic IP validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(senderIP)) {
      toast({
        description: 'Please enter a valid IP address',
        severity: 'critical'
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await securityApi.validateSPF({
        sender_email: senderEmail,
        sender_ip: senderIP
      });
      
      setValidationResult(result);
      
      if (onValidationComplete) {
        onValidationComplete(result);
      }

      if (result.success && result.spf_result?.valid) {
        toast({
          description: 'SPF validation passed - your email is properly configured',
          severity: 'success'
        });
      } else if (result.success && !result.spf_result?.valid) {
        toast({
          description: 'SPF validation failed - please check your DNS records',
          severity: 'warning'
        });
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || 'SPF validation failed';
      setError(message);
      toast({
        description: message,
        severity: 'critical'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-accent" />
          <CardTitle>SPF Record Validation</CardTitle>
        </div>
        <CardDescription>
          Validate that your email configuration has proper SPF records for deliverability
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sender-email">Sender Email</Label>
            <Input
              id="sender-email"
              type="email"
              placeholder="sender@yourdomain.com"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sender-ip">Sender IP Address</Label>
            <Input
              id="sender-ip"
              type="text"
              placeholder="192.168.1.1"
              value={senderIP}
              onChange={(e) => setSenderIP(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Validate Button */}
        <Button
          onClick={runSPFValidation}
          disabled={loading || !senderEmail.trim() || !senderIP.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Validating SPF Record...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Validate SPF Record
            </>
          )}
        </Button>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Validation Error</AlertTitle>
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Results */}
        {validationResult && validationResult.success && validationResult.spf_result && (
          <div className="space-y-4">
            {/* Overall Status */}
            <Alert className={getStatusColor(validationResult.spf_result.valid)}>
              <div className="flex items-center space-x-2">
                {getStatusIcon(validationResult.spf_result.valid)}
                <AlertTitle className="text-sm font-medium">
                  SPF Record {validationResult.spf_result.valid ? 'Valid' : 'Invalid'}
                </AlertTitle>
              </div>
              <AlertDescription className="mt-2">
                <div className="flex items-center justify-between">
                  <span>Recommendation:</span>
                  <Badge
                    variant={validationResult.validation.validations.spf.valid ? "success" : "destructive"}
                    className="text-xs"
                  >
                    {validationResult.recommendation === 'allowed' ? 'Allowed' : 'Review Required'}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>

            {/* SPF Record Details */}
            {validationResult.spf_result.record && (
              <div className="p-3 border rounded-lg bg-muted">
                <h4 className="text-sm font-medium mb-2">SPF Record Found:</h4>
                <code className="text-xs bg-white p-2 rounded border block overflow-x-auto">
                  {validationResult.spf_result.record}
                </code>
              </div>
            )}

            {/* Error Details */}
            {validationResult.spf_result.error && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">SPF Issue Detected</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  {validationResult.spf_result.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Recommendations */}
            {!validationResult.spf_result.valid && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">SPF Configuration Tips</AlertTitle>
                <AlertDescription className="text-blue-700">
                  <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                    <li>Ensure your domain has a valid SPF record in DNS</li>
                    <li>Include your mail server IP in the SPF record</li>
                    <li>Use tools like "dig TXT yourdomain.com" to check your SPF record</li>
                    <li>Example SPF record: "v=spf1 ip4:{senderIP} include:_spf.google.com ~all"</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Information Panel */}
        {!loading && !validationResult && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Enter your sender email and IP address to validate SPF records</p>
            <p className="text-xs mt-2">This helps ensure your emails won't be marked as spam</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 