import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Eye, 
  Zap,
  FileText
} from 'lucide-react';
import { securityApi } from '@/api/security-api';
import { toast } from '@/hooks/smtp-checker/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface ContentSecurityScannerProps {
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  onScanComplete?: (result: ContentScanResponse) => void;
  autoScan?: boolean;
  className?: string;
}

export const ContentSecurityScanner: React.FC<ContentSecurityScannerProps> = ({
  subject: initialSubject = '',
  htmlContent: initialHtmlContent = '',
  textContent: initialTextContent = '',
  onScanComplete,
  autoScan = false,
  className
}) => {
  const [subject, setSubject] = useState(initialSubject);
  const [htmlContent, setHtmlContent] = useState(initialHtmlContent);
  const [textContent, setTextContent] = useState(initialTextContent);
  const [scanResult, setScanResult] = useState<ContentScanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-scan when content changes (debounced)
  useEffect(() => {
    if (!autoScan) return;
    
    const timeoutId = setTimeout(() => {
      if (subject.trim() || htmlContent.trim() || textContent.trim()) {
        runContentScan();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [subject, htmlContent, textContent, autoScan]);

  const runContentScan = async () => {
    if (!subject.trim() && !htmlContent.trim() && !textContent.trim()) {
      toast({
        description: 'Please provide some content to scan (subject, HTML, or text)',
        severity: 'critical'
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await securityApi.scanContent({
        subject: subject,
        html_content: htmlContent,
        text_content: textContent
      });
      
      setScanResult(result);
      
      if (onScanComplete) {
        onScanComplete(result);
      }

      if (result.success && result.scan_result) {
        const { is_spam, risk_level } = result.scan_result;
        
        if (is_spam) {
          toast({
            description: `Content flagged as spam (${risk_level} risk) - review recommendations`,
            severity: 'warning'
          });
        } else {
          toast({
            description: `Content scan passed (${risk_level} risk level)`,
            severity: 'success'
          });
        }
      }
    } catch (err: unknown) {
      const message = err.response?.data?.detail || 'Content scanning failed';
      setError(message);
      toast({
        description: message,
        severity: 'critical'
      });
    } finally {
      setLoading(false);
    }
  };

  const runQuickScan = async () => {
    const content = htmlContent || textContent;
    if (!subject.trim() && !content.trim()) {
      toast({
        description: 'Please provide subject and content for quick scan',
        severity: 'critical'
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await securityApi.quickScanContent(subject, content);
      
      if (result.success) {
        toast({
          description: `Quick scan: ${result.is_spam ? 'Spam detected' : 'Content looks clean'}`,
          severity: result.is_spam ? 'warning' : 'success'
        });
      }
    } catch (err: unknown) {
      const message = err.response?.data?.detail || 'Quick scan failed';
      setError(message);
      toast({
        description: message,
        severity: 'critical'
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getSpamStatusIcon = (isSpam: boolean) => {
    return isSpam ? (
      <XCircle className="h-5 w-5 text-red-500" />
    ) : (
      <CheckCircle className="h-5 w-5 text-green-500" />
    );
  };

  const getSpamStatusColor = (isSpam: boolean) => {
    return isSpam ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-accent" />
            <CardTitle>Content Security Scanner</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runQuickScan}
              disabled={loading}
            >
              <Zap className="h-4 w-4 mr-2" />
              Quick Scan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={runContentScan}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Scanning...' : 'Full Scan'}
            </Button>
          </div>
        </div>
        <CardDescription>
          Scan your email content for spam indicators and deliverability issues
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content Input Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              placeholder="Enter email subject line..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="html-content">HTML Content</Label>
              <Textarea
                id="html-content"
                placeholder="Enter HTML email content..."
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="w-full min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-content">Text Content</Label>
              <Textarea
                id="text-content"
                placeholder="Enter plain text email content..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full min-h-[100px]"
              />
            </div>
          </div>
        </div>

        {/* Auto-scan indicator */}
        {autoScan && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>Auto-scanning enabled - results update as you type</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-32" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Scanning Error</AlertTitle>
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Scan Results */}
        {scanResult && scanResult.success && scanResult.scan_result && (
          <div className="space-y-4">
            {/* Overall Status */}
            <Alert className={getSpamStatusColor(scanResult.scan_result.is_spam)}>
              <div className="flex items-center space-x-2">
                {getSpamStatusIcon(scanResult.scan_result.is_spam)}
                <AlertTitle className="text-sm font-medium">
                  {scanResult.scan_result.is_spam ? 'Spam Detected' : 'Content Clean'}
                </AlertTitle>
              </div>
              <AlertDescription className="mt-2">
                <div className="flex items-center justify-between">
                  <span>Risk Level:</span>
                  <Badge
                    variant="outline"
                    className={getRiskLevelColor(scanResult.scan_result.risk_level)}
                  >
                    {scanResult.scan_result.risk_level.toUpperCase()}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>

            {/* Risk Assessment Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {scanResult.scan_result.spam_score}
                </div>
                <p className="text-sm text-muted-foreground">Spam Score</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {scanResult.risk_assessment.threshold}
                </div>
                <p className="text-sm text-muted-foreground">Threshold</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <div className={`text-2xl font-bold ${
                  scanResult.action_required ? 'text-red-600' : 'text-green-600'
                }`}>
                  {scanResult.action_required ? 'YES' : 'NO'}
                </div>
                <p className="text-sm text-muted-foreground">Action Required</p>
              </div>
            </div>

            {/* Recommendations */}
            {scanResult.scan_result.recommendations && scanResult.scan_result.recommendations.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Recommendations</AlertTitle>
                <AlertDescription className="text-blue-700">
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {scanResult.scan_result.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Required Warning */}
            {scanResult.action_required && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">Action Required</AlertTitle>
                <AlertDescription className="text-orange-700">
                  This content has been flagged and may require review before sending to ensure deliverability.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Information Panel */}
        {!loading && !scanResult && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Enter your email content above and click "Full Scan" to analyze</p>
            <p className="text-xs mt-2">Or use "Quick Scan" for a fast spam check</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 