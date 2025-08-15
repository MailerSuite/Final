import { useEffect, useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import PageHeader from '@/components/ui/page-header';
import { adminApi, PlanDetails } from "@/api/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminPlans = () => {
  const [plans, setPlans] = useState<PlanDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanDetails | null>(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await adminApi.listPlans(true); // Include inactive plans
      setPlans(data);
    } catch (e) {
      toast.error("Failed to load plans");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    try {
      setLoading(true);
      const planData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price_monthly: parseFloat(formData.get('price_monthly') as string),
        price_yearly: parseFloat(formData.get('price_yearly') as string),
        max_emails: parseInt(formData.get('max_emails') as string) || null,
        max_campaigns: parseInt(formData.get('max_campaigns') as string) || null,
        max_contacts: parseInt(formData.get('max_contacts') as string) || null,
        storage_limit_gb: parseFloat(formData.get('storage_limit_gb') as string),
        features: (formData.get('features') as string).split(',').map(f => f.trim()),
        api_calls_limit: parseInt(formData.get('api_calls_limit') as string) || null,
        support_level: formData.get('support_level') as string,
        custom_branding: formData.get('custom_branding') === 'on',
        team_members: parseInt(formData.get('team_members') as string) || null
      };
      
      await adminApi.createPlan(planData);
      toast.success("Plan created successfully");
      setCreateOpen(false);
      loadPlans();
    } catch (e) {
      toast.error("Failed to create plan");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (planId: string, planData: any) => {
    try {
      setLoading(true);
      await adminApi.updatePlan(planId, planData);
      toast.success("Plan updated successfully");
      setEditingPlan(null);
      loadPlans();
    } catch (e) {
      toast.error("Failed to update plan");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      inactive: "secondary",
      deprecated: "destructive",
      beta: "outline"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 space-y-4"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
            <span className="text-2xl">💳</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
              Subscription Plans Management
            </h1>
            <p className="text-zinc-400">Create and manage pricing plans • UPDATED!</p>
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Plans ({plans.length})</CardTitle>
          <Button onClick={() => setCreateOpen(true)} disabled={loading}>
            Create Plan
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.id} className="border p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(plan.status)}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingPlan(plan)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Monthly:</span> {formatCurrency(plan.price_monthly)}
                </div>
                <div>
                  <span className="font-medium">Yearly:</span> {formatCurrency(plan.price_yearly)}
                </div>
                <div>
                  <span className="font-medium">Subscribers:</span> {plan.subscriber_count}
                </div>
                <div>
                  <span className="font-medium">Storage:</span> {plan.storage_limit_gb}GB
                </div>
              </div>
              
              {plan.features && plan.features.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Features:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {plan.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {plans.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">No plans found.</p>
          )}
          
          {loading && (
            <p className="text-sm text-muted-foreground">Loading plans...</p>
          )}
        </CardContent>
      </Card>

      {/* Create Plan Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Plan Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="support_level">Support Level</Label>
                <Select name="support_level" defaultValue="basic">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="dedicated">Dedicated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_monthly">Monthly Price ($)</Label>
                <Input id="price_monthly" name="price_monthly" type="number" step="0.01" required />
              </div>
              <div>
                <Label htmlFor="price_yearly">Yearly Price ($)</Label>
                <Input id="price_yearly" name="price_yearly" type="number" step="0.01" required />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="max_emails">Max Emails</Label>
                <Input id="max_emails" name="max_emails" type="number" />
              </div>
              <div>
                <Label htmlFor="max_campaigns">Max Campaigns</Label>
                <Input id="max_campaigns" name="max_campaigns" type="number" />
              </div>
              <div>
                <Label htmlFor="max_contacts">Max Contacts</Label>
                <Input id="max_contacts" name="max_contacts" type="number" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storage_limit_gb">Storage Limit (GB)</Label>
                <Input id="storage_limit_gb" name="storage_limit_gb" type="number" step="0.1" required />
              </div>
              <div>
                <Label htmlFor="api_calls_limit">API Calls Limit</Label>
                <Input id="api_calls_limit" name="api_calls_limit" type="number" />
              </div>
            </div>
            
            <div>
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Input id="features" name="features" placeholder="Email Campaigns, Analytics, API Access" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="team_members">Team Members</Label>
                <Input id="team_members" name="team_members" type="number" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="custom_branding" name="custom_branding" />
                <Label htmlFor="custom_branding">Custom Branding</Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Create Plan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={editingPlan !== null} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Plan Name</Label>
                  <Input 
                    value={editingPlan.name} 
                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={editingPlan.status} 
                    onValueChange={(value) => setEditingPlan({...editingPlan, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={editingPlan.description} 
                  onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Monthly Price ($)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={editingPlan.price_monthly} 
                    onChange={(e) => setEditingPlan({...editingPlan, price_monthly: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Yearly Price ($)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={editingPlan.price_yearly} 
                    onChange={(e) => setEditingPlan({...editingPlan, price_yearly: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingPlan(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleUpdate(editingPlan.id, editingPlan)}
                  disabled={loading}
                >
                  Update Plan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminPlans;
