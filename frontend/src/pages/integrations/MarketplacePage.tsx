import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  CheckCircleIcon,
  StarIcon,
  LinkIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  EnvelopeIcon,
  CloudIcon,
  CogIcon,
  PlayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface Integration {
  id: string
  name: string
  description: string
  category: string
  icon: React.ComponentType<any>
  isConnected: boolean
  isPremium: boolean
  rating: number
  installs: string
  features: string[]
  setupComplexity: 'Easy' | 'Medium' | 'Advanced'
  tags: string[]
}

const MarketplacePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showConnectedOnly, setShowConnectedOnly] = useState(false)

  const categories = [
    { id: 'all', name: 'All Integrations', count: 24 },
    { id: 'crm', name: 'CRM & Sales', count: 8 },
    { id: 'ecommerce', name: 'E-commerce', count: 6 },
    { id: 'analytics', name: 'Analytics', count: 4 },
    { id: 'social', name: 'Social Media', count: 3 },
    { id: 'productivity', name: 'Productivity', count: 3 }
  ]

  const integrations: Integration[] = [
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Sync contacts and leads with your Salesforce CRM automatically',
      category: 'crm',
      icon: CloudIcon,
      isConnected: true,
      isPremium: false,
      rating: 4.8,
      installs: '10k+',
      setupComplexity: 'Medium',
      features: [
        'Two-way contact sync',
        'Lead scoring integration',
        'Campaign tracking',
        'Custom field mapping'
      ],
      tags: ['CRM', 'Sales', 'Automation']
    },
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Connect your Shopify store to send targeted campaigns to customers',
      category: 'ecommerce',
      icon: ShoppingCartIcon,
      isConnected: false,
      isPremium: false,
      rating: 4.9,
      installs: '25k+',
      setupComplexity: 'Easy',
      features: [
        'Customer segmentation',
        'Purchase behavior tracking',
        'Abandoned cart emails',
        'Product recommendations'
      ],
      tags: ['E-commerce', 'Shopify', 'Automation']
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Integrate with HubSpot for advanced marketing automation and lead nurturing',
      category: 'crm',
      icon: UserGroupIcon,
      isConnected: true,
      isPremium: true,
      rating: 4.7,
      installs: '15k+',
      setupComplexity: 'Medium',
      features: [
        'Contact lifecycle tracking',
        'Marketing automation',
        'Deal pipeline integration',
        'Advanced reporting'
      ],
      tags: ['CRM', 'Marketing', 'Premium']
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      description: 'Track email campaign performance with Google Analytics integration',
      category: 'analytics',
      icon: ChartBarIcon,
      isConnected: false,
      isPremium: false,
      rating: 4.6,
      installs: '30k+',
      setupComplexity: 'Easy',
      features: [
        'UTM tracking',
        'Goal conversion tracking',
        'Attribution analysis',
        'Custom events'
      ],
      tags: ['Analytics', 'Tracking', 'Google']
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect with 5000+ apps through Zapier automation workflows',
      category: 'productivity',
      icon: PlayIcon,
      isConnected: false,
      isPremium: false,
      rating: 4.5,
      installs: '50k+',
      setupComplexity: 'Easy',
      features: [
        '5000+ app connections',
        'Multi-step workflows',
        'Conditional logic',
        'Real-time triggers'
      ],
      tags: ['Automation', 'Workflows', 'Integration']
    },
    {
      id: 'calendly',
      name: 'Calendly',
      description: 'Schedule follow-up meetings automatically based on email interactions',
      category: 'productivity',
      icon: CalendarIcon,
      isConnected: false,
      isPremium: true,
      rating: 4.4,
      installs: '8k+',
      setupComplexity: 'Easy',
      features: [
        'Automatic meeting scheduling',
        'Email interaction triggers',
        'Calendar integration',
        'Meeting reminders'
      ],
      tags: ['Scheduling', 'Meetings', 'Premium']
    }
  ]

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory
    
    const matchesConnected = !showConnectedOnly || integration.isConnected
    
    return matchesSearch && matchesCategory && matchesConnected
  })

  const handleConnect = (integrationId: string) => {
    // Implementation for connecting integration
    console.log('Connecting integration:', integrationId)
  }

  const handleDisconnect = (integrationId: string) => {
    // Implementation for disconnecting integration
    console.log('Disconnecting integration:', integrationId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Integration Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Connect your favorite tools and services to supercharge your email marketing
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name} ({category.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Switch
            id="connected-only"
            checked={showConnectedOnly}
            onCheckedChange={setShowConnectedOnly}
          />
          <Label htmlFor="connected-only" className="text-sm">
            Connected only
          </Label>
        </div>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="connected">My Integrations</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredIntegrations.map((integration) => (
              <Card 
                key={integration.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg",
                  integration.isConnected && "ring-2 ring-green-500/20"
                )}
                onClick={() => setSelectedIntegration(integration)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <integration.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <div className="flex items-center space-x-1 mt-1">
                          <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-muted-foreground">
                            {integration.rating} • {integration.installs}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {integration.isPremium && (
                        <Badge variant="secondary">Premium</Badge>
                      )}
                      {integration.isConnected && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription>{integration.description}</CardDescription>
                  
                  <div className="flex flex-wrap gap-1">
                    {integration.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {integration.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{integration.tags.length - 2}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Setup: {integration.setupComplexity}
                    </span>
                    <Button
                      size="sm"
                      variant={integration.isConnected ? "outline" : "default"}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (integration.isConnected) {
                          handleDisconnect(integration.id)
                        } else {
                          handleConnect(integration.id)
                        }
                      }}
                    >
                      {integration.isConnected ? (
                        <>
                          <CogIcon className="h-4 w-4 mr-2" />
                          Configure
                        </>
                      ) : (
                        <>
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {integrations.filter(i => i.isConnected).map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <integration.icon className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <Badge variant="default" className="bg-green-500 mt-1">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <CogIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Last sync:</span>
                      <span className="text-muted-foreground">2 hours ago</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <span className="text-green-600">Healthy</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {integrations
              .sort((a, b) => parseInt(b.installs.replace(/\D/g, '')) - parseInt(a.installs.replace(/\D/g, '')))
              .slice(0, 6)
              .map((integration) => (
                <Card key={integration.id} className="cursor-pointer hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <integration.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1">
                            <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{integration.rating}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{integration.installs}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Integration Details Modal */}
      {selectedIntegration && (
        <Dialog open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <selectedIntegration.icon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">{selectedIntegration.name}</DialogTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-1">
                      <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{selectedIntegration.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{selectedIntegration.installs} installs</span>
                    {selectedIntegration.isPremium && (
                      <>
                        <span className="text-sm text-muted-foreground">•</span>
                        <Badge variant="secondary">Premium</Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-6">
              <DialogDescription className="text-base">
                {selectedIntegration.description}
              </DialogDescription>

              <div>
                <h4 className="font-semibold mb-3">Features</h4>
                <ul className="space-y-2">
                  {selectedIntegration.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedIntegration.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Setup complexity: <span className="font-medium">{selectedIntegration.setupComplexity}</span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Learn More
                  </Button>
                  <Button>
                    {selectedIntegration.isConnected ? (
                      <>
                        <CogIcon className="h-4 w-4 mr-2" />
                        Configure
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Connect Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default MarketplacePage