import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Server, Shield, Globe } from 'lucide-react';

export interface HostConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  security: 'none' | 'ssl' | 'tls' | 'starttls';
  enabled: boolean;
  last_checked?: string;
  status?: 'valid' | 'invalid' | 'error';
}

interface HostConfigurationCardProps {
  config: HostConfig;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggle?: (id: string, enabled: boolean) => void;
}

export const HostConfigurationCard: React.FC<HostConfigurationCardProps> = ({
  config,
  onEdit,
  onDelete,
  onToggle
}) => {
  const getSecurityIcon = (security: string) => {
    switch (security) {
      case 'ssl':
      case 'tls':
        return <Shield className="h-4 w-4 text-green-400" />;
      case 'starttls':
        return <Shield className="h-4 w-4 text-yellow-400" />;
      default:
        return <Globe className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="default" aria-label="Status: Valid">Valid</Badge>;
      case 'invalid':
        return <Badge variant="destructive" aria-label="Status: Invalid">Invalid</Badge>;
      case 'error':
        return <Badge variant="secondary" aria-label="Status: Error">Error</Badge>;
      default:
        return <Badge variant="outline" aria-label="Status: Unknown">Unknown</Badge>;
    }
  };

  return (
    <Card className="bg-background/30 border-border hover:border-border transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-100 text-lg flex items-center gap-2">
            <Server className="h-5 w-5" />
            {config.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(config.status)}
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => onToggle?.(config.id, enabled)}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Host:</span>
            <p className="text-foreground font-mono">{config.host}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Port:</span>
            <p className="text-foreground">{config.port}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Username:</span>
            <p className="text-foreground">{config.username}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Security:</span>
            <div className="flex items-center gap-1">
              {getSecurityIcon(config.security)}
              <span className="text-foreground capitalize">{config.security}</span>
            </div>
          </div>
        </div>

        {config.last_checked && (
          <div className="text-xs text-muted-foreground">
            Last checked: {new Date(config.last_checked).toLocaleString()}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit?.(config.id)}
            className="border-border text-muted-foreground hover:bg-card"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete?.(config.id)}
            className="border-red-600 text-red-400 hover:bg-red-600/10"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HostConfigurationCard; 