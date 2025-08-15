import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  CreditCardIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

const BillingPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  // Mock data - replace with real API calls
  const currentPlan = {
    name: 'Professional',
    price: '$29',
    period: 'month',
    status: 'active',
    nextBilling: '2024-02-15',
    emailsSent: 8500,
    emailsLimit: 10000,
    features: [
      'Up to 10,000 emails per month',
      'Advanced analytics',
      'AI email optimization',
      'Priority support',
      'Custom templates'
    ]
  }

  const invoices = [
    {
      id: 'INV-2024-001',
      date: '2024-01-15',
      amount: '$29.00',
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-2023-012',
      date: '2023-12-15',
      amount: '$29.00',
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-2023-011',
      date: '2023-11-15',
      amount: '$29.00',
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-2023-010',
      date: '2023-10-15',
      amount: '$19.00',
      status: 'paid',
      downloadUrl: '#'
    }
  ]

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$9',
      period: 'month',
      description: 'Perfect for small businesses getting started',
      emails: '2,500',
      features: [
        'Up to 2,500 emails per month',
        'Basic analytics',
        'Email templates',
        'Email support'
      ],
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$29',
      period: 'month',
      description: 'Ideal for growing businesses',
      emails: '10,000',
      features: [
        'Up to 10,000 emails per month',
        'Advanced analytics',
        'AI email optimization',
        'Priority support',
        'Custom templates',
        'A/B testing'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$99',
      period: 'month',
      description: 'For large organizations',
      emails: '50,000',
      features: [
        'Up to 50,000 emails per month',
        'Advanced AI features',
        'Custom integrations',
        'Dedicated support',
        'Custom branding',
        'Advanced automation',
        'Team collaboration'
      ],
      popular: false
    }
  ]

  const paymentMethods = [
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true
    }
  ]

  const usagePercentage = (currentPlan.emailsSent / currentPlan.emailsLimit) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription, billing information, and usage
        </p>
      </div>

      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>Current Plan</span>
                <Badge variant="secondary">{currentPlan.status}</Badge>
              </CardTitle>
              <CardDescription>
                Your subscription is active until {currentPlan.nextBilling}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {currentPlan.price}
                <span className="text-sm font-normal text-muted-foreground">
                  /{currentPlan.period}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{currentPlan.name}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Email Usage This Month</span>
              <span className="text-sm text-muted-foreground">
                {currentPlan.emailsSent.toLocaleString()} / {currentPlan.emailsLimit.toLocaleString()}
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {(100 - usagePercentage).toFixed(1)}% remaining
            </p>
          </div>
          
          {usagePercentage > 80 && (
            <Alert>
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                You're approaching your monthly email limit. Consider upgrading your plan.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Emails sent this month</span>
                  <span className="font-semibold">{currentPlan.emailsSent.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Campaigns created</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Open rate</span>
                  <span className="font-semibold">24.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Click rate</span>
                  <span className="font-semibold">3.2%</span>
                </div>
              </CardContent>
            </Card>

            {/* Next Billing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Next Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <span>{currentPlan.nextBilling}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CurrencyDollarIcon className="h-5 w-5 text-muted-foreground" />
                  <span>{currentPlan.price}/{currentPlan.period}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Update Billing Date
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={cn(
                  "relative cursor-pointer transition-colors",
                  plan.popular && "border-primary",
                  selectedPlan === plan.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      {plan.price}
                      <span className="text-lg font-normal text-muted-foreground">
                        /{plan.period}
                      </span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-primary">
                      {plan.emails}
                    </div>
                    <div className="text-sm text-muted-foreground">emails/month</div>
                  </div>
                  <Separator />
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-4"
                    variant={plan.id === 'professional' ? 'secondary' : 'default'}
                    disabled={plan.id === 'professional'}
                  >
                    {plan.id === 'professional' ? 'Current Plan' : (
                      <>
                        <ArrowUpIcon className="h-4 w-4 mr-2" />
                        Upgrade
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>
                Download and view your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">{invoice.id}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>{invoice.amount}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === 'paid' ? 'secondary' : 'destructive'}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Manage your payment methods and billing information
                  </CardDescription>
                </div>
                <Button>Add Payment Method</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded flex items-center justify-center">
                        <CreditCardIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {method.brand} ending in {method.last4}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {method.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BillingPage