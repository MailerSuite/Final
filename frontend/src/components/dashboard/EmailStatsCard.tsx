import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import useSessionStore from "@/store/session";
import { toast } from "sonner";
import axiosInstance from "@/http/axios";
import { cn } from "@/lib/utils";

interface EmailStats {
  total_emails: number;
  messages_synced: number;
  delivery_rate: number;
  campaigns: {
    total: number;
    active: number;
  };
  leads: {
    total: number;
    valid: number;
  };
  last_updated: string;
}

export default function EmailStatsCard() {
  const { session } = useSessionStore();
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmailStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get('/dashboard/overview');
      const data = response.data;

      setEmailStats({
        total_emails: data.emails?.total_emails || 0,
        messages_synced: data.emails?.messages_synced || 0,
        delivery_rate: data.emails?.delivery_rate || 0,
        campaigns: {
          total: data.emails?.campaigns?.total || 0,
          active: data.emails?.campaigns?.active || 0
        },
        leads: {
          total: data.emails?.leads?.total || 0,
          valid: data.emails?.leads?.valid || 0
        },
        last_updated: data.last_updated || new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Failed to fetch email stats:', err);
      setError('Failed to load email statistics');
      // Set fallback data for demo purposes
      setEmailStats({
        total_emails: 40700,
        messages_synced: 38950,
        delivery_rate: 95.7,
        campaigns: { total: 12, active: 3 },
        leads: { total: 15000, valid: 14200 },
        last_updated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmailStats();

    // Refresh every 60 seconds
    const interval = setInterval(fetchEmailStats, 60000);
    return () => clearInterval(interval);
  }, [fetchEmailStats]);

  if (loading && !emailStats) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Icon name="Mail" size="sm" ariaLabel="Email Statistics" />
            Email Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-24 bg-zinc-800/50" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Icon name="Mail" size="sm" className="text-blue-500" ariaLabel="Email Statistics" />
            Email Statistics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchEmailStats}
              disabled={loading}
              className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            >
              <Icon name="RefreshCw" size="sm" className={cn("mr-1", loading && "animate-spin")} ariaLabel="Refresh" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {error ? (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <Icon name="AlertCircle" size="sm" ariaLabel="Error" />
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-zinc-800/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{emailStats?.total_emails.toLocaleString()}</div>
                <div className="text-xs text-zinc-400">Total Emails</div>
              </div>
              <div className="text-center p-3 bg-zinc-800/30 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{emailStats?.delivery_rate.toFixed(1)}%</div>
                <div className="text-xs text-zinc-400">Delivery Rate</div>
              </div>
            </div>

            {/* Campaigns & Leads */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Campaigns</span>
                  <div className="flex items-center gap-1">
                    <Icon name="TrendingUp" size="sm" className="text-green-400" ariaLabel="Active campaigns" />
                    <span className="text-green-400 font-medium">{emailStats?.campaigns.active}</span>
                    <span className="text-zinc-500">/</span>
                    <span className="text-zinc-300">{emailStats?.campaigns.total}</span>
                  </div>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(emailStats?.campaigns.active || 0) / (emailStats?.campaigns.total || 1) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Leads</span>
                  <div className="flex items-center gap-1">
                    <Icon name="TrendingUp" size="sm" className="text-blue-400" ariaLabel="Valid leads" />
                    <span className="text-blue-400 font-medium">{emailStats?.leads.valid.toLocaleString()}</span>
                    <span className="text-zinc-500">/</span>
                    <span className="text-zinc-300">{emailStats?.leads.total.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(emailStats?.leads.valid || 0) / (emailStats?.leads.total || 1) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-zinc-500 text-center">
              Last updated: {new Date(emailStats?.last_updated || '').toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 