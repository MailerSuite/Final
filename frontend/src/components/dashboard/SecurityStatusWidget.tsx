import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Eye,
  Filter,
  Globe,
  Server,
  Lock
} from 'lucide-react';
import { securityApi, type SecurityStatus } from '@/api/security-api';
import { toast } from '@/hooks/smtp-checker/use-toast';

interface SecurityStatusWidgetProps {
  className?: string;
}

export const SecurityStatusWidget: React.FC<SecurityStatusWidgetProps> = ({ className }) => {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurityStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await securityApi.getStatus();
      setStatus(data);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to fetch security status';
      setError(message);
      console.error('Security status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityStatus();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchSecurityStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  const getSystemStatusVariant = (systemStatus: string): React.ComponentProps<typeof Badge>["variant"] => {
    const s = systemStatus?.toLowerCase()
    if (s === 'operational') return 'default'
    if (s === 'degraded') return 'secondary'
    if (s === 'down') return 'destructive'
    return 'outline'
  }

  const getFeatureStatusIcon = (enabled: boolean) => {
    return enabled ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-muted-foreground" />
    );
  };

  const getSecurityScore = () => {
    if (!status) return 0;
    
    const features = status.security_features;
    if (!features) return 0;
    
    let score = 0;
    let total = 0;

    // Core security features (worth more points)
    if (features.spf_validation) score += 25;
    total += 25;

    if (features.content_scanning) score += 25;
    total += 25;

    if (features.firewall_enabled) score += 20;
    total += 20;

    // Proxy enforcement - safe access with optional chaining
    if (features.proxy_enforcement?.smtp) score += 10;
    total += 10;

    if (features.proxy_enforcement?.imap) score += 10;
    total += 10;

    // Enhanced features
    if (features.enhanced_headers) score += 5;
    total += 5;

    if (features.reputation_monitoring) score += 5;
    total += 5;

    return Math.round((score / total) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card className={`bg-zinc-900/50 border-zinc-800 ${className}`}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-white">Security Status</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">Overall system security monitoring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full bg-zinc-800" />
          <Skeleton className="h-4 w-3/4 bg-zinc-800" />
          <Skeleton className="h-8 w-32 bg-zinc-800" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full bg-zinc-800" />
            <Skeleton className="h-16 w-full bg-zinc-800" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-zinc-900/50 border-zinc-800 ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-white">Security Status</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSecurityStatus}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-900 bg-red-950/50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const securityScore = getSecurityScore();

  return (
    <Card className={`bg-zinc-900/50 border-zinc-800 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-white">Security Status</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getSystemStatusVariant(status.system_status)} aria-label={`System status: ${status.system_status}`}>
              {status.system_status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSecurityStatus}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-muted-foreground">
          Overall system security monitoring and feature status
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Security Score */}
        <div className="text-center p-4 border border-zinc-800 rounded-lg bg-zinc-900/50">
          <div className={`text-3xl font-bold ${getScoreColor(securityScore)}`}>
            {securityScore}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">Security Score</p>
        </div>

        {/* Core Features */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Core Security Features</h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
              <div className="flex items-center space-x-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-white">SPF Validation</span>
              </div>
              {getFeatureStatusIcon(status.security_features.spf_validation)}
            </div>

            <div className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
              <div className="flex items-center space-x-3">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-white">Content Scanning</span>
              </div>
              {getFeatureStatusIcon(status.security_features.content_scanning)}
            </div>

            <div className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
              <div className="flex items-center space-x-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-white">Firewall Protection</span>
              </div>
              {getFeatureStatusIcon(status.security_features.firewall_enabled)}
            </div>

            <div className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
              <div className="flex items-center space-x-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-white">Reputation Monitoring</span>
              </div>
              {getFeatureStatusIcon(status.security_features.reputation_monitoring)}
            </div>
          </div>
        </div>

        {/* Proxy Enforcement */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Proxy Enforcement</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg bg-zinc-900/30">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-white">SMTP</span>
              </div>
              {getFeatureStatusIcon(status.security_features.proxy_enforcement?.smtp || false)}
            </div>

            <div className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg bg-zinc-900/30">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-white">IMAP</span>
              </div>
              {getFeatureStatusIcon(status.security_features.proxy_enforcement?.imap || false)}
            </div>
          </div>
        </div>

        {/* Blacklist Providers */}
        <div className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg bg-zinc-900/30">
          <div className="flex items-center space-x-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-white">Blacklist Providers</span>
          </div>
          <Badge variant="outline" className="text-xs border-zinc-700 text-muted-foreground">
            {status.blacklist_providers} active
          </Badge>
        </div>

        {/* Enhanced Headers */}
        {status.security_features.enhanced_headers && (
          <div className="p-3 border border-blue-900 rounded-lg bg-blue-950/30">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-300">Enhanced Email Headers Active</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 