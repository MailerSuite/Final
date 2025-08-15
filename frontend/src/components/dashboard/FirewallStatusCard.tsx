import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, ShieldOff, RefreshCw, AlertCircle } from "lucide-react";
import useSessionStore from "@/store/session";
import { toast } from "sonner";
import axiosInstance from "@/http/axios";

interface FirewallStatus {
  enabled: boolean;
  proxy_active: boolean;
  session_id: string | null;
  last_updated: string;
}

export default function FirewallStatusCard() {
  const { session, activeProxy } = useSessionStore();
  const [firewallStatus, setFirewallStatus] = useState<FirewallStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFirewallStatus = useCallback(async () => {
    if (!session?.id) {
      setFirewallStatus(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Check if there's an active proxy for this session
      const proxyResponse = await axiosInstance.get(`/proxies/${session.id}/active`);
      const proxyData = proxyResponse.data;
      
      setFirewallStatus({
        enabled: proxyData?.firewall_on || activeProxy?.firewall_on || false,
        proxy_active: !!proxyData,
        session_id: session.id,
        last_updated: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Failed to fetch firewall status:', err);
      setError('Failed to load firewall status');
      // Fallback to local state
      setFirewallStatus({
        enabled: activeProxy?.firewall_on || false,
        proxy_active: !!activeProxy,
        session_id: session.id,
        last_updated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, [session?.id, activeProxy]);

  useEffect(() => {
    fetchFirewallStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchFirewallStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchFirewallStatus]);

  const toggleFirewall = async () => {
    if (!session?.id || !firewallStatus) return;

    try {
      setLoading(true);
      const newStatus = !firewallStatus.enabled;
      
      await axiosInstance.post(`/sessions/${session.id}/proxy/firewall`, {
        enabled: newStatus
      });
      
      setFirewallStatus(prev => prev ? { ...prev, enabled: newStatus } : null);
      toast.success(`Firewall ${newStatus ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to toggle firewall';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.id) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <ShieldOff className="h-4 w-4" />
            Firewall Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-4">
            <p className="text-sm text-zinc-400">No session selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading && !firewallStatus) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Firewall Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-16 bg-zinc-800/50" />
        </CardContent>
      </Card>
    );
  }

  const firewallEnabled = firewallStatus?.enabled || false;
  const proxyActive = firewallStatus?.proxy_active || false;

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            {firewallEnabled ? (
              <Shield className="h-4 w-4 text-green-500" />
            ) : (
              <ShieldOff className="h-4 w-4 text-red-500" />
            )}
            Firewall Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchFirewallStatus}
            disabled={loading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Protection</span>
            <Badge
              variant={firewallEnabled ? "primary" : "destructive"}
              className={firewallEnabled ? "bg-green-600" : "bg-red-600"}
            >
              Firewall {firewallEnabled ? 'On' : 'Off'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Proxy</span>
            <Badge
              variant={proxyActive ? "outline" : "secondary"}
              className={proxyActive ? "border-blue-500 text-blue-400" : ""}
            >
              {proxyActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2 rounded bg-red-900/20 border border-red-800">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}

          <Button
            variant={firewallEnabled ? "destructive" : "primary"}
            size="sm"
            onClick={toggleFirewall}
            disabled={loading || !proxyActive}
            className="w-full"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : firewallEnabled ? (
              <ShieldOff className="h-4 w-4 mr-2" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            {firewallEnabled ? 'Disable' : 'Enable'} Firewall
          </Button>
          
          {!proxyActive && (
            <p className="text-xs text-zinc-500 text-center">
              Proxy required for firewall control
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 