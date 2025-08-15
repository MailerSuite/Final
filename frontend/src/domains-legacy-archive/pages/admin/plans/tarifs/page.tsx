import React, { useEffect, useState, FormEvent } from "react";
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { 
  DollarSign, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  Users,
  RefreshCw,
  CheckCircle,
  Package,
  Star,
  TrendingUp,
  Mail,
  List
} from 'lucide-react';
import axios from 'axios';

interface Tarif {
  id: number;
  name: string;
  price_monthly: number;
  price_yearly: number;
  description: string;
  features: string[];
  max_emails: number;
  max_campaigns: number;
  max_lists: number;
  active: boolean;
  created_at: string;
}

const AdminTarifs = () => {
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price_monthly: 0,
    price_yearly: 0,
    description: "",
    features: [] as string[],
    max_emails: 1000,
    max_campaigns: 1,
    max_lists: 1,
    active: true
  });

  const loadTarifs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/admin/tarifs');
      setTarifs(response.data);
      toast.success('💰 Tarifs loaded - LIVE DATA!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to load tarifs';
      toast.error(errorMessage);
      console.error('Error loading tarifs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTarifs();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Tarif name is required');
      return;
    }
    
    try {
      setCreating(true);
      await axios.post('/api/v1/admin/tarifs', formData);
      setFormData({
        name: "",
        price_monthly: 0,
        price_yearly: 0,
        description: "",
        features: [],
        max_emails: 1000,
        max_campaigns: 1,
        max_lists: 1,
        active: true
      });
      setCreateDialogOpen(false);
      await loadTarifs();
      toast.success('Tarif created successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to create tarif';
      toast.error(errorMessage);
      console.error('Error creating tarif:', error);
    } finally {
      setCreating(false);
    }
  };

  const formatPrice = (price: number) => {
    return price === -1 ? 'Unlimited' : price.toLocaleString();
  };

  const formatCurrency = (price: number) => {
    return `$${price.toFixed(2)}`;
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
      className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          className="text-center space-y-4"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <motion.div
              className="p-3 bg-green-500/20 rounded-xl backdrop-blur-sm border border-green-500/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <DollarSign className="w-8 h-8 text-green-400" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Pricing Management
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage subscription plans and pricing - <span className="text-green-400 font-semibold">LIVE DATA!</span>
          </p>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="px-3 py-1 bg-green-500/20 border-green-500/30 text-green-300">
              {tarifs.length} Pricing Plans
            </Badge>
            <Badge variant="outline" className="px-3 py-1 bg-blue-500/20 border-blue-500/30 text-blue-300">
              {tarifs.filter(t => t.active).length} Active
            </Badge>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={loadTarifs}
              disabled={loading}
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background/95 border-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center space-x-2">
                    <Package className="w-5 h-5 text-green-400" />
                    <span>Create Pricing Plan</span>
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Plan Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., Basic Plan"
                        className="bg-card/50 border-border text-white"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Monthly Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price_monthly}
                        onChange={(e) => setFormData({...formData, price_monthly: parseFloat(e.target.value) || 0})}
                        placeholder="29.99"
                        className="bg-card/50 border-border text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Yearly Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price_yearly}
                        onChange={(e) => setFormData({...formData, price_yearly: parseFloat(e.target.value) || 0})}
                        placeholder="299.99"
                        className="bg-card/50 border-border text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Max Emails/Month</Label>
                      <Input
                        type="number"
                        value={formData.max_emails}
                        onChange={(e) => setFormData({...formData, max_emails: parseInt(e.target.value) || 0})}
                        placeholder="10000"
                        className="bg-card/50 border-border text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Plan description..."
                      className="bg-card/50 border-border text-white"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Max Campaigns</Label>
                      <Input
                        type="number"
                        value={formData.max_campaigns}
                        onChange={(e) => setFormData({...formData, max_campaigns: parseInt(e.target.value) || 0})}
                        placeholder="5"
                        className="bg-card/50 border-border text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Max Lists</Label>
                      <Input
                        type="number"
                        value={formData.max_lists}
                        onChange={(e) => setFormData({...formData, max_lists: parseInt(e.target.value) || 0})}
                        placeholder="10"
                        className="bg-card/50 border-border text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Active Plan</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.active ? 'Active' : 'Inactive'}
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
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                    >
                      {creating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Create Plan
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Pricing Plans Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="flex items-center space-x-3 text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Loading pricing plans...</span>
              </div>
            </div>
          ) : tarifs.length === 0 ? (
            <motion.div
              className="col-span-full text-center py-12"
              variants={itemVariants}
            >
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Pricing Plans</h3>
              <p className="text-muted-foreground">Create your first pricing plan to get started.</p>
            </motion.div>
          ) : (
            tarifs.map((tarif, index) => (
              <motion.div
                key={tarif.id}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Card className={`bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 relative overflow-hidden
                  ${index === 1 ? 'ring-2 ring-blue-500/50' : ''}`}>
                  
                  {/* Popular badge for middle plan */}
                  {index === 1 && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-white text-xl">{tarif.name}</CardTitle>
                      {!tarif.active && (
                        <Badge className="bg-muted/20 text-muted-foreground border-border/30">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-green-400">
                          {formatCurrency(tarif.price_monthly)}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-lg text-muted-foreground">
                          {formatCurrency(tarif.price_yearly)}
                        </span>
                        <span className="text-sm text-muted-foreground">/year</span>
                        {tarif.price_yearly < tarif.price_monthly * 12 && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                            Save {Math.round((1 - tarif.price_yearly / (tarif.price_monthly * 12)) * 100)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {tarif.description && (
                      <p className="text-muted-foreground text-sm mt-2">{tarif.description}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center space-x-2 text-muted-foreground">
                          <Mail className="w-4 h-4 text-blue-400" />
                          <span>Emails/Month</span>
                        </span>
                        <span className="font-semibold text-white">
                          {formatPrice(tarif.max_emails)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center space-x-2 text-muted-foreground">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span>Campaigns</span>
                        </span>
                        <span className="font-semibold text-white">
                          {formatPrice(tarif.max_campaigns)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center space-x-2 text-muted-foreground">
                          <List className="w-4 h-4 text-purple-400" />
                          <span>Contact Lists</span>
                        </span>
                        <span className="font-semibold text-white">
                          {formatPrice(tarif.max_lists)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Plan Features */}
                    {tarif.features && tarif.features.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground">Features:</h4>
                        <div className="space-y-1">
                          {tarif.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span>{feature}</span>
                            </div>
                          ))}
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
                        className="bg-red-500/20 border-red-500/30 hover:bg-red-500/40 text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground text-center pt-2">
                      Created: {new Date(tarif.created_at).toLocaleDateString()}
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

export default AdminTarifs;