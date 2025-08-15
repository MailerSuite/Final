import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings,
  Save,
  Edit,
  Plus,
  Trash2,
  Clock,
  DollarSign,
  Cpu,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Package,
  Timer,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface TrialConfiguration {
  id: number;
  config_name: string;
  is_active: boolean;
  duration_minutes: number;
  min_threads: number;
  max_threads: number;
  max_campaigns: number;
  price_usd: number;
  price_btc: string;
  max_extensions: number;
  extension_minutes: number;
  extension_price_usd: number;
  allowed_features: string[];
  created_at: string;
}

const TrialConfigAdmin: React.FC = () => {
  const [configs, setConfigs] = useState<TrialConfiguration[]>([]);
  const [editingConfig, setEditingConfig] = useState<TrialConfiguration | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<number | null>(null);

  const availableFeatures = [
    'basic_campaigns',
    'basic_smtp_imap',
    'basic_templates',
    'basic_analytics',
    'basic_upload',
    'blacklist_checking',
    'basic_proxy'
  ];

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trial/admin/configurations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      setConfigs(data.configurations || []);
    } catch (error) {
      toast.error('Failed to fetch trial configurations');
      console.error('Error fetching configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (config: Partial<TrialConfiguration>) => {
    try {
      const method = config.id ? 'PUT' : 'POST';
      const url = config.id 
        ? `/api/trial/admin/configurations/${config.id}` 
        : '/api/trial/admin/configurations';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        toast.success(config.id ? 'Configuration updated' : 'Configuration created');
        await fetchConfigurations();
        setEditingConfig(null);
        setIsCreateModalOpen(false);
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error('Error saving configuration:', error);
    }
  };

  const deleteConfiguration = async (id: number) => {
    try {
      const response = await fetch(`/api/trial/admin/configurations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        toast.success('Configuration deleted');
        await fetchConfigurations();
      } else {
        toast.error('Failed to delete configuration');
      }
    } catch (error) {
      toast.error('Failed to delete configuration');
      console.error('Error deleting configuration:', error);
    }
  };

  const toggleConfigurationStatus = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/trial/admin/configurations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ is_active: isActive })
      });

      if (response.ok) {
        toast.success(`Configuration ${isActive ? 'activated' : 'deactivated'}`);
        await fetchConfigurations();
      } else {
        toast.error('Failed to update configuration status');
      }
    } catch (error) {
      toast.error('Failed to update configuration status');
      console.error('Error updating status:', error);
    }
  };

  const ConfigurationEditModal: React.FC<{
    config: TrialConfiguration | null;
    onSave: (config: Partial<TrialConfiguration>) => void;
    onClose: () => void;
  }> = ({ config, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<TrialConfiguration>>(
      config || {
        config_name: '',
        is_active: true,
        duration_minutes: 60,
        min_threads: 2,
        max_threads: 5,
        max_campaigns: 2,
        price_usd: 1.0,
        price_btc: '0.00002',
        max_extensions: 2,
        extension_minutes: 30,
        extension_price_usd: 0.5,
        allowed_features: ['basic_campaigns', 'basic_smtp_imap', 'basic_templates', 'basic_analytics']
      }
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    const toggleFeature = (feature: string) => {
      const currentFeatures = formData.allowed_features || [];
      const newFeatures = currentFeatures.includes(feature)
        ? currentFeatures.filter(f => f !== feature)
        : [...currentFeatures, feature];
      
      setFormData({ ...formData, allowed_features: newFeatures });
    };

    return (
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {config ? 'Edit Trial Configuration' : 'Create Trial Configuration'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="config_name">Configuration Name</Label>
              <Input
                id="config_name"
                value={formData.config_name || ''}
                onChange={(e) => setFormData({ ...formData, config_name: e.target.value })}
                placeholder="e.g., default, promo, weekend"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active || false}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active Configuration</Label>
            </div>
          </div>

          {/* Trial Duration & Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Trial Duration & Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration_minutes">Duration (Minutes)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  value={formData.duration_minutes || 60}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  min="1"
                  max="1440"
                />
              </div>
              <div>
                <Label htmlFor="max_campaigns">Max Campaigns</Label>
                <Input
                  id="max_campaigns"
                  type="number"
                  value={formData.max_campaigns || 2}
                  onChange={(e) => setFormData({ ...formData, max_campaigns: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                />
              </div>
              <div>
                <Label htmlFor="min_threads">Min Threads</Label>
                <Input
                  id="min_threads"
                  type="number"
                  value={formData.min_threads || 2}
                  onChange={(e) => setFormData({ ...formData, min_threads: parseInt(e.target.value) })}
                  min="1"
                  max="5"
                />
              </div>
              <div>
                <Label htmlFor="max_threads">Max Threads</Label>
                <Input
                  id="max_threads"
                  type="number"
                  value={formData.max_threads || 5}
                  onChange={(e) => setFormData({ ...formData, max_threads: parseInt(e.target.value) })}
                  min="1"
                  max="20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_usd">Price (USD)</Label>
                <Input
                  id="price_usd"
                  type="number"
                  step="0.01"
                  value={formData.price_usd || 1.0}
                  onChange={(e) => setFormData({ ...formData, price_usd: parseFloat(e.target.value) })}
                  min="0.01"
                  max="50"
                />
              </div>
              <div>
                <Label htmlFor="price_btc">Price (BTC)</Label>
                <Input
                  id="price_btc"
                  value={formData.price_btc || '0.00002'}
                  onChange={(e) => setFormData({ ...formData, price_btc: e.target.value })}
                  placeholder="0.00002"
                />
              </div>
            </CardContent>
          </Card>

          {/* Extension Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Extension Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="max_extensions">Max Extensions</Label>
                <Input
                  id="max_extensions"
                  type="number"
                  value={formData.max_extensions || 2}
                  onChange={(e) => setFormData({ ...formData, max_extensions: parseInt(e.target.value) })}
                  min="0"
                  max="5"
                />
              </div>
              <div>
                <Label htmlFor="extension_minutes">Extension Duration (Min)</Label>
                <Input
                  id="extension_minutes"
                  type="number"
                  value={formData.extension_minutes || 30}
                  onChange={(e) => setFormData({ ...formData, extension_minutes: parseInt(e.target.value) })}
                  min="5"
                  max="120"
                />
              </div>
              <div>
                <Label htmlFor="extension_price_usd">Extension Price (USD)</Label>
                <Input
                  id="extension_price_usd"
                  type="number"
                  step="0.01"
                  value={formData.extension_price_usd || 0.5}
                  onChange={(e) => setFormData({ ...formData, extension_price_usd: parseFloat(e.target.value) })}
                  min="0.01"
                  max="25"
                />
              </div>
            </CardContent>
          </Card>

          {/* Feature Access */}
          <Card>
            <CardHeader>
              <CardTitle>Allowed Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {availableFeatures.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={feature}
                      checked={(formData.allowed_features || []).includes(feature)}
                      onChange={() => toggleFeature(feature)}
                      className="rounded border-border"
                    />
                    <Label htmlFor={feature} className="text-sm">
                      {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              {config ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <PageHeader title="Trial Plan Configuration" />
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Configuration
            </Button>
          </DialogTrigger>
          <ConfigurationEditModal 
            config={null} 
            onSave={saveConfiguration} 
            onClose={() => setIsCreateModalOpen(false)} 
          />
        </Dialog>
      </div>

      {/* Configurations List */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </CardContent>
          </Card>
        ) : configs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Configurations</h3>
              <p className="text-muted-foreground mb-4">Create your first trial configuration to get started.</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Configuration
              </Button>
            </CardContent>
          </Card>
        ) : (
          configs.map((config) => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={cn(
                "relative overflow-hidden",
                config.is_active && "border-blue-200 bg-blue-50/50"
              )}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{config.config_name}</CardTitle>
                      <Badge 
                        variant={config.is_active ? "default" : "secondary"}
                        className={config.is_active ? "bg-green-600" : ""}
                      >
                        {config.is_active ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                        ) : (
                          <><EyeOff className="w-3 h-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.is_active}
                        onCheckedChange={(checked) => toggleConfigurationStatus(config.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingConfig(config)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setConfigToDelete(config.id);
                          setDeleteConfirmOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{config.duration_minutes} minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Threads</p>
                        <p className="font-medium">{config.min_threads}-{config.max_threads}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-yellow-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-medium">${config.price_usd}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Extensions</p>
                        <p className="font-medium">{config.max_extensions} x {config.extension_minutes}min</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Allowed Features ({config.allowed_features.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {config.allowed_features.slice(0, 3).map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {config.allowed_features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{config.allowed_features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <ConfigurationEditModal 
          config={editingConfig} 
          onSave={saveConfiguration} 
          onClose={() => setEditingConfig(null)} 
        />
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={() => {
          if (configToDelete) {
            deleteConfiguration(configToDelete);
            setConfigToDelete(null);
          }
        }}
        title="Delete Configuration"
        description="Are you sure you want to delete this trial configuration? This action cannot be undone."
      />
    </div>
  );
};

export default TrialConfigAdmin; 