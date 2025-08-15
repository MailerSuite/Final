import React, { useState, useEffect } from 'react'
import {
  ServerStackIcon,
  GlobeAltIcon,
  BoltIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SignalIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PlusIcon,
  ChevronUpDownIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  LockClosedIcon,
  LockOpenIcon,
  WifiIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import PageShell from '@/pages/finalui2/components/PageShell'
import PageConsole from '@/components/ui/PageConsole'
import StandardPageWrapper from '@/components/layout/StandardPageWrapper'
import { motion } from 'framer-motion'

// Mock data for thousands of proxies
const generateMockProxies = (count: number) => {
  const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  ]

  const providers = ['Luminati', 'Oxylabs', 'SmartProxy', 'Residential', 'DataCenter', 'Mobile', 'Private', 'Storm']
  const types = ['HTTP', 'HTTPS', 'SOCKS4', 'SOCKS5']
  const statuses = ['online', 'offline', 'slow', 'blacklisted']

  return Array.from({ length: count }, (_, i) => {
    const country = countries[Math.floor(Math.random() * countries.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const isBlacklisted = status === 'blacklisted'
    const speed = isBlacklisted ? Math.random() * 500 : 500 + Math.random() * 9500

    return {
      id: `proxy-${i + 1}`,
      ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      port: [3128, 8080, 8888, 1080, 9050][Math.floor(Math.random() * 5)],
      type: types[Math.floor(Math.random() * types.length)],
      country,
      provider: providers[Math.floor(Math.random() * providers.length)],
      status,
      ping: Math.floor(Math.random() * 300) + 10,
      bandwidth: Math.floor(Math.random() * 100) + 1, // Mbps
      speed, // KB/s
      uptime: status === 'online' ? 85 + Math.random() * 15 : Math.random() * 50,
      anonymity: ['transparent', 'anonymous', 'elite'][Math.floor(Math.random() * 3)],
      price: (Math.random() * 10 + 0.5).toFixed(2),
      connectionLimit: Math.floor(Math.random() * 100) + 10,
      currentConnections: Math.floor(Math.random() * 50),
      lastChecked: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      authentication: Math.random() > 0.5,
      rotating: Math.random() > 0.4,
      residential: Math.random() > 0.6,
      mobile: Math.random() > 0.8,
      selected: false,
      city: ['New York', 'London', 'Tokyo', 'Paris', 'Berlin', 'Sydney', 'Toronto', 'Amsterdam'][Math.floor(Math.random() * 8)],
      isp: ['Comcast', 'Verizon', 'AT&T', 'BT', 'Vodafone', 'T-Mobile', 'Orange', 'Telstra'][Math.floor(Math.random() * 8)]
    }
  })
}

const ProxyPoolPage: React.FC = () => {
  const [proxies, setProxies] = useState(generateMockProxies(2134))
  const [filteredProxies, setFilteredProxies] = useState(proxies)
  const [selectedProxies, setSelectedProxies] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('all')
  const [anonymityFilter, setAnonymityFilter] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 15])
  const [speedRange, setSpeedRange] = useState([0, 10000])
  const [showRotatingOnly, setShowRotatingOnly] = useState(false)
  const [showResidentialOnly, setShowResidentialOnly] = useState(false)
  const [sortBy, setSortBy] = useState('ping')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [rotationInterval, setRotationInterval] = useState(60) // seconds
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [selectedPurchaseProxy, setSelectedPurchaseProxy] = useState<unknown>(null)

  // Auto-rotation effect
  useEffect(() => {
    if (isAutoRotating) {
      const interval = setInterval(() => {
        setProxies(prev => {
          const rotatingProxies = prev.filter(p => p.rotating)
          const nonRotatingProxies = prev.filter(p => !p.rotating)

          // Shuffle rotating proxies
          const shuffled = [...rotatingProxies].sort(() => Math.random() - 0.5)

          // Update some statuses randomly
          shuffled.forEach(proxy => {
            if (Math.random() > 0.9) {
              proxy.status = ['online', 'offline', 'slow'][Math.floor(Math.random() * 3)]
              proxy.ping = Math.floor(Math.random() * 300) + 10
            }
          })

          return [...shuffled, ...nonRotatingProxies]
        })
      }, rotationInterval * 1000)

      return () => clearInterval(interval)
    }
  }, [isAutoRotating, rotationInterval])

  // Filter and sort effect
  useEffect(() => {
    let filtered = [...proxies]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.ip.includes(searchQuery) ||
        p.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.isp.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter(p => p.country.code === countryFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === typeFilter)
    }

    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter(p => p.provider === providerFilter)
    }

    // Anonymity filter
    if (anonymityFilter !== 'all') {
      filtered = filtered.filter(p => p.anonymity === anonymityFilter)
    }

    // Price range filter
    filtered = filtered.filter(p =>
      parseFloat(p.price) >= priceRange[0] && parseFloat(p.price) <= priceRange[1]
    )

    // Speed range filter
    filtered = filtered.filter(p => p.speed >= speedRange[0] && p.speed <= speedRange[1])

    // Rotating filter
    if (showRotatingOnly) {
      filtered = filtered.filter(p => p.rotating)
    }

    // Residential filter
    if (showResidentialOnly) {
      filtered = filtered.filter(p => p.residential)
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy as keyof typeof a]
      let bVal = b[sortBy as keyof typeof b]

      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    setFilteredProxies(filtered)
  }, [proxies, searchQuery, countryFilter, statusFilter, typeFilter, providerFilter, anonymityFilter, priceRange, speedRange, showRotatingOnly, showResidentialOnly, sortBy, sortOrder])

  const paginatedProxies = filteredProxies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredProxies.length / itemsPerPage)

  const handleSelectProxy = (id: string) => {
    setSelectedProxies(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedProxies.length === paginatedProxies.length) {
      setSelectedProxies([])
    } else {
      setSelectedProxies(paginatedProxies.map(p => p.id))
    }
  }

  const handlePurchase = (proxy: unknown) => {
    setSelectedPurchaseProxy(proxy)
    setShowPurchaseDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-emerald-400'
      case 'offline': return 'text-red-400'
      case 'slow': return 'text-amber-400'
      case 'blacklisted': return 'text-red-600'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'offline': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'slow': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'blacklisted': return 'bg-red-600/10 text-red-600 border-red-600/20'
      default: return ''
    }
  }

  const getAnonymityBadge = (level: string) => {
    switch (level) {
      case 'elite': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'anonymous': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      case 'transparent': return 'bg-muted/10 text-muted-foreground border-border/20'
      default: return ''
    }
  }

  const getPingColor = (ping: number) => {
    if (ping < 100) return 'text-emerald-400'
    if (ping < 200) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <PageShell title="Proxy Pool Manager">
      <PageConsole>
        <StandardPageWrapper
          title="Proxy Pool Manager"
          subtitle={`${filteredProxies.length.toLocaleString()} proxies available • ${selectedProxies.length} selected`}
          showComingSoon={true}
          actions={
            <>
              <Badge variant="outline" className={cn(
                "px-3 py-1",
                isAutoRotating ? "border-emerald-500/50 text-emerald-400" : "border-border text-muted-foreground"
              )}>
                <ArrowsRightLeftIcon className="w-4 h-4 mr-2" />
                {isAutoRotating ? 'Auto-Rotating' : 'Static'}
              </Badge>

              <Button variant="outline" className="bg-card/50 border-border">
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Export List
              </Button>

              <Button className="bg-gradient-to-r from-purple-500 to-indigo-500">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Proxy
              </Button>
            </>
          }
        >

          {/* Filters Bar */}
          <div className="px-6 py-4 border-b border-border bg-background/30">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by IP, provider, city, or ISP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card/50 border-border text-white"
                  />
                </div>
              </div>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[150px] bg-card/50 border-border">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="US">🇺🇸 United States</SelectItem>
                  <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                  <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                  <SelectItem value="FR">🇫🇷 France</SelectItem>
                  <SelectItem value="JP">🇯🇵 Japan</SelectItem>
                  <SelectItem value="CN">🇨🇳 China</SelectItem>
                  <SelectItem value="RU">🇷🇺 Russia</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px] bg-card/50 border-border">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="HTTP">HTTP</SelectItem>
                  <SelectItem value="HTTPS">HTTPS</SelectItem>
                  <SelectItem value="SOCKS4">SOCKS4</SelectItem>
                  <SelectItem value="SOCKS5">SOCKS5</SelectItem>
                </SelectContent>
              </Select>

              <Select value={anonymityFilter} onValueChange={setAnonymityFilter}>
                <SelectTrigger className="w-[140px] bg-card/50 border-border">
                  <SelectValue placeholder="Anonymity" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                  <SelectItem value="anonymous">Anonymous</SelectItem>
                  <SelectItem value="transparent">Transparent</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-card/50 border-border">
                    <FunnelIcon className="w-4 h-4 mr-2" />
                    Advanced Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 bg-background border-border" align="end">
                  <DropdownMenuLabel>Advanced Filters</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-card" />

                  <div className="p-3 space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Price Range ($/GB)</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm">${priceRange[0]}</span>
                        <Slider
                          value={priceRange}
                          onValueChange={setPriceRange}
                          max={15}
                          step={0.5}
                          className="flex-1"
                        />
                        <span className="text-sm">${priceRange[1]}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Speed Range (KB/s)</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm">{speedRange[0]}</span>
                        <Slider
                          value={speedRange}
                          onValueChange={setSpeedRange}
                          max={10000}
                          step={100}
                          className="flex-1"
                        />
                        <span className="text-sm">{speedRange[1]}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Rotating Only</Label>
                      <Switch
                        checked={showRotatingOnly}
                        onCheckedChange={setShowRotatingOnly}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Residential Only</Label>
                      <Switch
                        checked={showResidentialOnly}
                        onCheckedChange={setShowResidentialOnly}
                      />
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-2 ml-auto">
                <Label className="text-xs text-muted-foreground">Auto-Rotate</Label>
                <Switch
                  checked={isAutoRotating}
                  onCheckedChange={setIsAutoRotating}
                  className="data-[state=checked]:bg-purple-500"
                />
                {isAutoRotating && (
                  <Input
                    type="number"
                    value={rotationInterval}
                    onChange={(e) => setRotationInterval(parseInt(e.target.value))}
                    className="w-16 h-8 text-xs bg-card/50 border-border"
                    min="10"
                    max="600"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-6 gap-4">
              <Card className="glass-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Proxies</p>
                      <p className="text-2xl font-bold text-white">{proxies.length.toLocaleString()}</p>
                    </div>
                    <ServerStackIcon className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Online</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        {proxies.filter(p => p.status === 'online').length.toLocaleString()}
                      </p>
                    </div>
                    <WifiIcon className="w-8 h-8 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Speed</p>
                      <p className="text-2xl font-bold text-white">
                        {Math.round(proxies.reduce((acc, p) => acc + p.speed, 0) / proxies.length)} KB/s
                      </p>
                    </div>
                    <BoltIcon className="w-8 h-8 text-amber-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Ping</p>
                      <p className="text-2xl font-bold text-white">
                        {Math.round(proxies.reduce((acc, p) => acc + p.ping, 0) / proxies.length)}ms
                      </p>
                    </div>
                    <SignalIcon className="w-8 h-8 text-indigo-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Countries</p>
                      <p className="text-2xl font-bold text-white">
                        {new Set(proxies.map(p => p.country.code)).size}
                      </p>
                    </div>
                    <GlobeAltIcon className="w-8 h-8 text-cyan-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Elite Proxies</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {proxies.filter(p => p.anonymity === 'elite').length.toLocaleString()}
                      </p>
                    </div>
                    <ShieldCheckIcon className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Table */}
          <div className="flex-1 px-6 pb-6 overflow-hidden">
            <Card className="h-full glass-card border-border">
              <CardContent className="p-0 h-full flex flex-col">
                {/* Table Header */}
                <div className="flex items-center p-4 border-b border-border">
                  <Checkbox
                    checked={selectedProxies.length === paginatedProxies.length}
                    onCheckedChange={handleSelectAll}
                    className="mr-4"
                  />

                  <div className="flex items-center gap-4 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSortBy('ip')
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                      className="text-xs"
                    >
                      IP Address
                      <ChevronUpDownIcon className="w-3 h-3 ml-1" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSortBy('country')
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                      className="text-xs"
                    >
                      Location
                      <ChevronUpDownIcon className="w-3 h-3 ml-1" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSortBy('type')
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                      className="text-xs"
                    >
                      Type
                      <ChevronUpDownIcon className="w-3 h-3 ml-1" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSortBy('status')
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                      className="text-xs"
                    >
                      Status
                      <ChevronUpDownIcon className="w-3 h-3 ml-1" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSortBy('ping')
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                      className="text-xs"
                    >
                      Ping
                      <ChevronUpDownIcon className="w-3 h-3 ml-1" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSortBy('speed')
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                      className="text-xs"
                    >
                      Speed
                      <ChevronUpDownIcon className="w-3 h-3 ml-1" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSortBy('price')
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                      className="text-xs"
                    >
                      Price
                      <ChevronUpDownIcon className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Table Body */}
                <ScrollArea className="flex-1">
                  <div className="space-y-1 p-4">
                    {paginatedProxies.map((proxy) => (
                      <div
                        key={proxy.id}
                        className={cn(
                          "flex items-center p-3 rounded-lg border transition-all",
                          selectedProxies.includes(proxy.id)
                            ? "border-purple-500/50 bg-purple-500/5"
                            : "border-border hover:border-border hover:bg-card/30"
                        )}
                      >
                        <Checkbox
                          checked={selectedProxies.includes(proxy.id)}
                          onCheckedChange={() => handleSelectProxy(proxy.id)}
                          className="mr-4"
                        />

                        <div className="flex items-center gap-6 flex-1">
                          {/* IP & Port */}
                          <div className="min-w-[180px]">
                            <p className="text-sm font-medium text-white font-mono">{proxy.ip}:{proxy.port}</p>
                            <p className="text-xs text-muted-foreground">{proxy.isp}</p>
                          </div>

                          {/* Location */}
                          <div className="min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{proxy.country.flag}</span>
                              <div>
                                <p className="text-sm text-muted-foreground">{proxy.country.name}</p>
                                <p className="text-xs text-muted-foreground">{proxy.city}</p>
                              </div>
                            </div>
                          </div>

                          {/* Type & Provider */}
                          <div className="min-w-[120px] space-y-1">
                            <Badge variant="outline" className="text-xs border-border">
                              {proxy.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-border">
                              {proxy.provider}
                            </Badge>
                          </div>

                          {/* Status */}
                          <div className="min-w-[100px]">
                            <Badge className={cn("text-xs", getStatusBadge(proxy.status))}>
                              {proxy.status === 'online' && <CheckCircleIcon className="w-3 h-3 mr-1" />}
                              {proxy.status === 'offline' && <XCircleIcon className="w-3 h-3 mr-1" />}
                              {proxy.status === 'slow' && <ClockIcon className="w-3 h-3 mr-1" />}
                              {proxy.status === 'blacklisted' && <ExclamationTriangleIcon className="w-3 h-3 mr-1" />}
                              {proxy.status}
                            </Badge>
                          </div>

                          {/* Anonymity */}
                          <div className="min-w-[100px]">
                            <Badge className={cn("text-xs", getAnonymityBadge(proxy.anonymity))}>
                              {proxy.anonymity === 'elite' && <LockClosedIcon className="w-3 h-3 mr-1" />}
                              {proxy.anonymity === 'anonymous' && <LockOpenIcon className="w-3 h-3 mr-1" />}
                              {proxy.anonymity}
                            </Badge>
                          </div>

                          {/* Ping */}
                          <div className="min-w-[80px]">
                            <div className="flex items-center gap-1">
                              <SignalIcon className={cn("w-4 h-4", getPingColor(proxy.ping))} />
                              <span className={cn("text-sm font-medium", getPingColor(proxy.ping))}>
                                {proxy.ping}ms
                              </span>
                            </div>
                          </div>

                          {/* Speed */}
                          <div className="min-w-[100px]">
                            <div className="flex items-center gap-1">
                              <BoltIcon className="w-4 h-4 text-amber-400" />
                              <span className="text-sm text-white">{proxy.speed} KB/s</span>
                            </div>
                          </div>

                          {/* Bandwidth */}
                          <div className="min-w-[100px]">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={(proxy.currentConnections / proxy.connectionLimit) * 100}
                                className="h-2 flex-1"
                              />
                              <span className="text-xs text-muted-foreground">{proxy.bandwidth} Mbps</span>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="min-w-[80px]">
                            <span className="text-sm font-medium text-purple-400">
                              ${proxy.price}/GB
                            </span>
                          </div>

                          {/* Features */}
                          <div className="flex items-center gap-1 min-w-[100px]">
                            {proxy.authentication && (
                              <Badge variant="outline" className="text-xs px-1 py-0 border-emerald-500/50 text-emerald-400">
                                AUTH
                              </Badge>
                            )}
                            {proxy.rotating && (
                              <Badge variant="outline" className="text-xs px-1 py-0 border-sky-500/50 text-sky-400">
                                ROT
                              </Badge>
                            )}
                            {proxy.residential && (
                              <Badge variant="outline" className="text-xs px-1 py-0 border-purple-500/50 text-purple-400">
                                RES
                              </Badge>
                            )}
                            {proxy.mobile && (
                              <Badge variant="outline" className="text-xs px-1 py-0 border-orange-500/50 text-orange-400">
                                MOB
                              </Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 ml-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => {
                                // Check proxy functionality
                                console.log('Testing proxy:', proxy.id)
                              }}
                            >
                              <ShieldCheckIcon className="w-4 h-4 mr-1" />
                              Test
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handlePurchase(proxy)}
                            >
                              <ShoppingCartIcon className="w-4 h-4" />
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Cog6ToothIcon className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-background border-border" align="end">
                                <DropdownMenuItem className="text-sm">
                                  <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                                  Clone
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-sm">
                                  <ChartBarIcon className="w-4 h-4 mr-2" />
                                  View Stats
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-card" />
                                <DropdownMenuItem className="text-sm text-red-400">
                                  <TrashIcon className="w-4 h-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProxies.length)} of {filteredProxies.length} proxies
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="bg-card/50 border-border"
                    >
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = currentPage - 2 + i
                        if (page < 1 || page > totalPages) return null

                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              "w-8 h-8 p-0",
                              page === currentPage
                                ? "bg-gradient-to-r from-purple-500 to-indigo-500"
                                : "bg-card/50 border-border"
                            )}
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-card/50 border-border"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Dialog */}
          <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
            <DialogContent className="bg-background border-border text-white">
              <DialogHeader>
                <DialogTitle>Purchase Proxy Access</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Configure your purchase for {selectedPurchaseProxy?.ip}
                </DialogDescription>
              </DialogHeader>

              {selectedPurchaseProxy && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                    <div>
                      <p className="text-sm font-medium font-mono">{selectedPurchaseProxy.ip}:{selectedPurchaseProxy.port}</p>
                      <p className="text-xs text-muted-foreground">{selectedPurchaseProxy.country.name} • {selectedPurchaseProxy.city}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadge(selectedPurchaseProxy.status)}>
                        {selectedPurchaseProxy.status}
                      </Badge>
                      <Badge className={getAnonymityBadge(selectedPurchaseProxy.anonymity)}>
                        {selectedPurchaseProxy.anonymity}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Subscription Type</Label>
                      <Select defaultValue="bandwidth">
                        <SelectTrigger className="mt-1 bg-card/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          <SelectItem value="bandwidth">Bandwidth Package</SelectItem>
                          <SelectItem value="time">Time-based Access</SelectItem>
                          <SelectItem value="unlimited">Unlimited Access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Data Package</Label>
                      <Select defaultValue="100gb">
                        <SelectTrigger className="mt-1 bg-card/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          <SelectItem value="10gb">10 GB - ${(parseFloat(selectedPurchaseProxy.price) * 10).toFixed(2)}</SelectItem>
                          <SelectItem value="50gb">50 GB - ${(parseFloat(selectedPurchaseProxy.price) * 50).toFixed(2)}</SelectItem>
                          <SelectItem value="100gb">100 GB - ${(parseFloat(selectedPurchaseProxy.price) * 100).toFixed(2)}</SelectItem>
                          <SelectItem value="500gb">500 GB - ${(parseFloat(selectedPurchaseProxy.price) * 500).toFixed(2)}</SelectItem>
                          <SelectItem value="1tb">1 TB - ${(parseFloat(selectedPurchaseProxy.price) * 1000).toFixed(2)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Authentication</Label>
                      <Select defaultValue="ip">
                        <SelectTrigger className="mt-1 bg-card/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          <SelectItem value="ip">IP Whitelist</SelectItem>
                          <SelectItem value="user">Username/Password</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-border">
                      <span className="text-sm text-muted-foreground">Total Cost</span>
                      <span className="text-xl font-bold text-purple-400">
                        ${(parseFloat(selectedPurchaseProxy.price) * 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowPurchaseDialog(false)}
                      className="flex-1 bg-card/50 border-border"
                    >
                      Cancel
                    </Button>
                    <Button className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500">
                      <ShoppingCartIcon className="w-4 h-4 mr-2" />
                      Purchase Now
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </StandardPageWrapper>
      </PageConsole>
    </PageShell>
  )
}

export default ProxyPoolPage