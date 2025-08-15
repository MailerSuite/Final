import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { 
  Timer, 
  Package, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  DollarSign,
  Users,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Gift,
  Star,
  Calendar
} from 'lucide-react';

interface TrialConfig {
  id: number;
  name: string;
  description: string;
  duration_days: number;
  max_users: number;
  max_emails_per_day: number;
  max_campaigns: number;
  max_lists: number;
  features_included: string[];
  price_after_trial: number;
  auto_convert_to_plan_id?: number;
  is_active: boolean;
  trial_type: 'free' | 'premium' | 'enterprise';
  created_at: string;
  updated_at: string;
  usage_stats?: {
    total_trials_started: number;
    active_trials: number;
    conversion_rate: number;
    avg_usage_percentage: number;
  };
}

const PlansTrialConfigPage = () => {
  const [configs, setConfigs] = useState<TrialConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_days: 14,
    max_users: 5,
    max_emails_per_day: 100,
    max_campaigns: 3,
    max_lists: 5,
    features_included: [] as string[],
    price_after_trial: 29.99,
    auto_convert_to_plan_id: undefined as number | undefined,
    is_active: true,
    trial_type: 'free' as const
  });

  const availableFeatures = [
    'Email Templates',
    'Campaign Automation', 
    'Analytics Dashboard',
    'A/B Testing',
    'Custom Domains',
    'Priority Support',
    'Advanced Segmentation',
    'API Access',
    'White Label',
    'Custom Integrations'
  ];

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/admin/plans/trial-configs/detailed');
      setConfigs(response.data.configs || []);
      toast.success('⚙️ Trial configs loaded - LIVE DATA!');
    } catch (error: unknown) {
      const errorMessage = error.response?.data?.detail || 'Failed to load trial configurations';
      toast.error(errorMessage);
      console.error('Error loading trial configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Configuration name is required');
      return;
    }
    
    try {
      setCreating(true);
      await axios.post('/api/v1/admin/trial-configs', formData);
      setFormData({
        name: '',
        description: '',
        duration_days: 14,
        max_users: 5,
        max_emails_per_day: 100,
        max_campaigns: 3,
        max_lists: 5,
        features_included: [],
        price_after_trial: 29.99,
        auto_convert_to_plan_id: undefined,
        is_active: true,
        trial_type: 'free'
      });
      setCreateDialogOpen(false);
      await loadConfigs();
      toast.success('Trial configuration created successfully!');
    } catch (error: unknown) {
      const errorMessage = error.response?.data?.detail || 'Failed to create trial configuration';
      toast.error(errorMessage);
      console.error('Error creating trial config:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (configId: number) => {
    if (!confirm('Are you sure you want to delete this trial configuration?')) return;
    
    try {
      await axios.delete(`/api/v1/admin/trial-configs/${configId}`);
      await loadConfigs();
      toast.success('Trial configuration deleted successfully!');
    } catch (error: unknown) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete trial configuration';
      toast.error(errorMessage);
      console.error('Error deleting trial config:', error);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const getTrialTypeColor = (type: string) => {
    switch (type) {
      case 'free': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'premium': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'enterprise': return 'bg-gold-500/20 text-gold-300 border-gold-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border/30';
    }
  };

  const formatDuration = (days: number) => {
    if (days < 7) return `${days} days`;
    if (days === 7) return '1 week';
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    return `${Math.floor(days / 30)} months`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          className="text-center space-y-4"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <motion.div
              className="p-3 bg-purple-500/20 rounded-xl backdrop-blur-sm border border-purple-500/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Gift className="w-8 h-8 text-purple-400" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
              Trial Configuration
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage trial plans and configuration settings - <span className="text-green-400 font-semibold">LIVE DATA!</span>
          </p>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="px-3 py-1 bg-purple-500/20 border-purple-500/30 text-purple-300">
              {configs.length} Trial Configs
            </Badge>
            <Badge variant="outline" className="px-3 py-1 bg-green-500/20 border-green-500/30 text-green-300">
              {configs.filter(c => c.is_active).length} Active
            </Badge>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={loadConfigs}
              disabled={loading}
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Trial Config
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background/95 border-border max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center space-x-2">
                    <Package className="w-5 h-5 text-purple-400" />
                    <span>Create Trial Configuration</span>
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Configuration Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., Premium Trial"
                        className="bg-card/50 border-border text-white"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Trial Type</Label>
                      <Select value={formData.trial_type} onValueChange={(value: unknown) => setFormData({...formData, trial_type: value})}>
                        <SelectTrigger className="bg-card/50 border-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="free">Free Trial</SelectItem>
                          <SelectItem value="premium">Premium Trial</SelectItem>
                          <SelectItem value="enterprise">Enterprise Trial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Trial description..."
                      className="bg-card/50 border-border text-white"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Duration (days)</Label>
                      <Input
                        type="number"
                        value={formData.duration_days}
                        onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value) || 14})}
                        className="bg-card/50 border-border text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Max Users</Label>
                      <Input
                        type="number"
                        value={formData.max_users}
                        onChange={(e) => setFormData({...formData, max_users: parseInt(e.target.value) || 5})}
                        className="bg-card/50 border-border text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Price After Trial ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price_after_trial}
                        onChange={(e) => setFormData({...formData, price_after_trial: parseFloat(e.target.value) || 29.99})}
                        className="bg-card/50 border-border text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Emails/Day</Label>
                      <Input
                        type="number"
                        value={formData.max_emails_per_day}
                        onChange={(e) => setFormData({...formData, max_emails_per_day: parseInt(e.target.value) || 100})}
                        className="bg-card/50 border-border text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Max Campaigns</Label>
                      <Input
                        type="number"
                        value={formData.max_campaigns}
                        onChange={(e) => setFormData({...formData, max_campaigns: parseInt(e.target.value) || 3})}
                        className="bg-card/50 border-border text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Max Lists</Label>
                      <Input
                        type="number"
                        value={formData.max_lists}
                        onChange={(e) => setFormData({...formData, max_lists: parseInt(e.target.value) || 5})}
                        className="bg-card/50 border-border text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Included Features</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {availableFeatures.map((feature) => (
                        <label key={feature} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.features_included.includes(feature)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({...formData, features_included: [...formData.features_included, feature]});
                              } else {
                                setFormData({...formData, features_included: formData.features_included.filter(f => f !== feature)});
                              }
                            }}
                            className="rounded bg-muted border-border"
                          />
                          <span className="text-muted-foreground">{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Active Configuration</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                    >
                      {creating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Create Configuration
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Trial Configurations Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="flex items-center space-x-3 text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Loading trial configurations...</span>
              </div>
            </div>
          ) : configs.length === 0 ? (
            <motion.div
              className="col-span-full text-center py-12"
              variants={itemVariants}
            >
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Trial Configurations</h3>
              <p className="text-muted-foreground">Create your first trial configuration to get started.</p>
            </motion.div>
          ) : (
            configs.map((config, index) => (
              <motion.div
                key={config.id}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 relative overflow-hidden">
                  {/* Header */}
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-white text-xl">{config.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getTrialTypeColor(config.trial_type)}>
                          {config.trial_type}
                        </Badge>
                        {!config.is_active && (
                          <Badge className="bg-muted/20 text-muted-foreground border-border/30">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {config.description && (
                      <p className="text-muted-foreground text-sm">{config.description}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Trial Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="text-white font-semibold">{formatDuration(config.duration_days)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-green-400" />
                        <div>
                          <p className="text-muted-foreground">Max Users</p>
                          <p className="text-white font-semibold">{config.max_users}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <div>
                          <p className="text-muted-foreground">Emails/Day</p>
                          <p className="text-white font-semibold">{config.max_emails_per_day.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="text-muted-foreground">After Trial</p>
                          <p className="text-white font-semibold">${config.price_after_trial}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Features */}
                    {config.features_included && config.features_included.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground">Included Features:</h4>
                        <div className="flex flex-wrap gap-1">
                          {config.features_included.slice(0, 4).map((feature, idx) => (
                            <Badge key={idx} className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {config.features_included.length > 4 && (
                            <Badge className="bg-muted/20 text-muted-foreground border-border/30 text-xs">
                              +{config.features_included.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Usage Stats */}
                    {config.usage_stats && (
                      <div className="border-t border-white/10 pt-4">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Usage Statistics</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Total Trials:</p>
                            <p className="text-white font-semibold">{config.usage_stats.total_trials_started}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Active:</p>
                            <p className="text-white font-semibold">{config.usage_stats.active_trials}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Conversion:</p>
                            <p className="text-green-400 font-semibold">{config.usage_stats.conversion_rate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg Usage:</p>
                            <p className="text-blue-400 font-semibold">{config.usage_stats.avg_usage_percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex space-x-2 pt-4 border-t border-white/10">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-white/10 border-white/20 hover:bg-white/20 text-white"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(config.id)}
                        className="bg-red-500/20 border-red-500/30 hover:bg-red-500/40 text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground text-center pt-2">
                      Created: {new Date(config.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PlansTrialConfigPage;