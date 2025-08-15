import React, { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Key, 
  CreditCard, 
  Calendar as CalendarIcon, 
  RefreshCw, 
  User, 
  Building, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Gift,
  Clock,
  Zap,
  Crown,
  Users,
  Mail
} from 'lucide-react'
import { toast } from '@/hooks/useToast'
import { format } from 'date-fns'

// Schema definitions
const licenseAssignSchema = z.object({
  user_id: z.string().min(1, { message: 'User is required' }),
  plan_id: z.string().min(1, { message: 'Plan is required' }),
  is_trial: z.boolean().default(false),
  expires_at: z.date().optional(),
  custom_limits: z.object({
    emails_per_month: z.number().min(0).optional(),
    campaigns_per_month: z.number().min(0).optional(),
    smtp_accounts: z.number().min(0).optional(),
    team_members: z.number().min(0).optional(),
  }).optional(),
})

const trialLicenseSchema = z.object({
  user_id: z.string().min(1, { message: 'User is required' }),
  trial_plan: z.enum(['basic', 'professional', 'enterprise'], { message: 'Please select a trial plan' }),
  duration_days: z.number().min(1).max(90).default(14),
  features: z.array(z.string()).default([]),
  auto_convert: z.boolean().default(false),
})

const renewalSchema = z.object({
  license_id: z.string().min(1, { message: 'License is required' }),
  renewal_period: z.enum(['monthly', 'yearly'], { message: 'Please select renewal period' }),
  auto_renew: z.boolean().default(true),
  promo_code: z.string().optional(),
})

type LicenseAssignData = z.infer<typeof licenseAssignSchema>
type TrialLicenseData = z.infer<typeof trialLicenseSchema>
type RenewalData = z.infer<typeof renewalSchema>

interface LicenseManagementFormProps {
  onClose: () => void
  mode?: 'assign' | 'trial' | 'renew'
  selectedLicense?: any
}

// Mock data - replace with actual API calls
const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Manager' },
]

const mockPlans = [
  { 
    id: 'basic', 
    name: 'Basic Plan', 
    price: '$29/month',
    features: ['5,000 emails/month', '1 SMTP account', 'Basic support'],
    limits: { emails_per_month: 5000, smtp_accounts: 1, team_members: 1 }
  },
  { 
    id: 'professional', 
    name: 'Professional Plan', 
    price: '$99/month',
    features: ['50,000 emails/month', '5 SMTP accounts', 'Priority support', 'Advanced analytics'],
    limits: { emails_per_month: 50000, smtp_accounts: 5, team_members: 5 }
  },
  { 
    id: 'enterprise', 
    name: 'Enterprise Plan', 
    price: '$299/month',
    features: ['Unlimited emails', 'Unlimited SMTP', 'White-label', 'Dedicated support'],
    limits: { emails_per_month: -1, smtp_accounts: -1, team_members: -1 }
  },
]

const trialPlans = [
  { 
    id: 'basic', 
    name: 'Basic Trial', 
    duration: '14 days',
    features: ['1,000 emails', '1 SMTP account', 'Basic features'] 
  },
  { 
    id: 'professional', 
    name: 'Professional Trial', 
    duration: '14 days',
    features: ['10,000 emails', '3 SMTP accounts', 'All professional features'] 
  },
  { 
    id: 'enterprise', 
    name: 'Enterprise Trial', 
    duration: '30 days',
    features: ['25,000 emails', '10 SMTP accounts', 'All enterprise features'] 
  },
]

export default function LicenseManagementForm({ onClose, mode = 'assign', selectedLicense }: LicenseManagementFormProps) {
  const [activeTab, setActiveTab] = useState(mode)
  const [selectedPlan, setSelectedPlan] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)

  const assignForm = useForm<LicenseAssignData>({
    resolver: zodResolver(licenseAssignSchema),
    defaultValues: {
      user_id: '',
      plan_id: '',
      is_trial: false,
      custom_limits: {},
    },
  })

  const trialForm = useForm<TrialLicenseData>({
    resolver: zodResolver(trialLicenseSchema),
    defaultValues: {
      user_id: '',
      trial_plan: 'basic',
      duration_days: 14,
      features: [],
      auto_convert: false,
    },
  })

  const renewalForm = useForm<RenewalData>({
    resolver: zodResolver(renewalSchema),
    defaultValues: {
      license_id: selectedLicense?.id || '',
      renewal_period: 'monthly',
      auto_renew: true,
      promo_code: '',
    },
  })

  const handleAssignLicense = async (data: LicenseAssignData) => {
    setIsLoading(true)
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success?.('License assigned successfully')
      onClose()
    } catch (error) {
      toast.error?.('Failed to assign license')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTrial = async (data: TrialLicenseData) => {
    setIsLoading(true)
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success?.('Trial license created successfully')
      onClose()
    } catch (error) {
      toast.error?.('Failed to create trial license')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRenewLicense = async (data: RenewalData) => {
    setIsLoading(true)
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success?.('License renewed successfully')
      onClose()
    } catch (error) {
      toast.error?.('Failed to renew license')
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanBadge = (planId: string) => {
    switch (planId) {
      case 'basic': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Basic</Badge>
      case 'professional': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Professional</Badge>
      case 'enterprise': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Enterprise</Badge>
      default: return <Badge variant="outline">{planId}</Badge>
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'basic': return <Mail className="w-4 h-4" />
      case 'professional': return <Zap className="w-4 h-4" />
      case 'enterprise': return <Crown className="w-4 h-4" />
      default: return <Key className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Key className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">License Management</h2>
          <p className="text-muted-foreground">
            Manage user licenses, trial assignments, and subscription renewals
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assign" className="gap-2">
            <User className="w-4 h-4" />
            Assign License
          </TabsTrigger>
          <TabsTrigger value="trial" className="gap-2">
            <Gift className="w-4 h-4" />
            Create Trial
          </TabsTrigger>
          <TabsTrigger value="renew" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Renew License
          </TabsTrigger>
        </TabsList>

        {/* Assign License Tab */}
        <TabsContent value="assign" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Assign License to User
              </CardTitle>
              <CardDescription>
                Assign a paid license to a user with specific plan and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...assignForm}>
                <form onSubmit={assignForm.handleSubmit(handleAssignLicense)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={assignForm.control}
                      name="user_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select User *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose user" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <div className="font-medium">{user.name}</div>
                                      <div className="text-sm text-muted-foreground">{user.email}</div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {user.role}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the user to assign the license to
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={assignForm.control}
                      name="plan_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Plan *</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value)
                              setSelectedPlan(mockPlans.find(p => p.id === value))
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockPlans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  <div className="flex items-center gap-2">
                                    {getPlanIcon(plan.id)}
                                    <div>
                                      <div className="font-medium">{plan.name}</div>
                                      <div className="text-sm text-muted-foreground">{plan.price}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the subscription plan
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedPlan && (
                    <Card className="border-dashed">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getPlanIcon(selectedPlan.id)}
                            <h4 className="font-semibold">{selectedPlan.name}</h4>
                            {getPlanBadge(selectedPlan.id)}
                          </div>
                          <span className="text-lg font-bold text-primary">{selectedPlan.price}</span>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Included Features:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                            {selectedPlan.features.map((feature: string, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <FormField
                    control={assignForm.control}
                    name="expires_at"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Expiration Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-[240px] pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick expiration date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Leave blank for unlimited license duration
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={assignForm.control}
                    name="is_trial"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Trial License</FormLabel>
                          <FormDescription>
                            Mark this as a trial license with limited duration
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="gap-2">
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      Assign License
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Trial Tab */}
        <TabsContent value="trial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Create Trial License
              </CardTitle>
              <CardDescription>
                Set up a trial license for new users to evaluate the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...trialForm}>
                <form onSubmit={trialForm.handleSubmit(handleCreateTrial)} className="space-y-6">
                  <FormField
                    control={trialForm.control}
                    name="user_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select User *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose user for trial" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the user for the trial license
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {trialPlans.map((plan) => (
                      <FormField
                        key={plan.id}
                        control={trialForm.control}
                        name="trial_plan"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div 
                                className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                                  field.value === plan.id 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => field.onChange(plan.id)}
                              >
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">{plan.name}</h4>
                                    <Badge variant="outline">{plan.duration}</Badge>
                                  </div>
                                  <div className="space-y-2">
                                    {plan.features.map((feature, index) => (
                                      <div key={index} className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                        {feature}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={trialForm.control}
                      name="duration_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trial Duration (Days)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min={1}
                              max={90}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Trial duration in days (1-90)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={trialForm.control}
                      name="auto_convert"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Auto Convert</FormLabel>
                            <FormDescription>
                              Automatically convert to paid plan after trial
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="gap-2">
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Gift className="w-4 h-4" />
                      )}
                      Create Trial
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Renew License Tab */}
        <TabsContent value="renew" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Renew License
              </CardTitle>
              <CardDescription>
                Renew an existing license with updated terms and billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...renewalForm}>
                <form onSubmit={renewalForm.handleSubmit(handleRenewLicense)} className="space-y-6">
                  <FormField
                    control={renewalForm.control}
                    name="license_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License to Renew *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="License ID or select from list"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the license ID to renew
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={renewalForm.control}
                    name="renewal_period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renewal Period *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">Monthly</div>
                                  <div className="text-sm text-muted-foreground">Billed every month</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="yearly">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">Yearly (Save 20%)</div>
                                  <div className="text-sm text-muted-foreground">Billed annually</div>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the billing cycle for renewal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={renewalForm.control}
                    name="promo_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Promotion Code (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter promo code"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Apply a promotional code for discounts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={renewalForm.control}
                    name="auto_renew"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Auto-Renewal</FormLabel>
                          <FormDescription>
                            Automatically renew this license before expiration
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Alert>
                    <CreditCard className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Billing Information:</strong> The renewal will be charged to the payment method associated with this license. 
                      You can update payment details in the billing section.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="gap-2">
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      Renew License
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}