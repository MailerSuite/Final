import React, { useState, useEffect } from 'react'
import {
  ServerIcon,
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
  Cog6ToothIcon
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
import StandardPageWrapper from '@/components/layout/StandardPageWrapper'

// Mock data for thousands of SMTPs
const generateMockSMTPs = (count: number) => {
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
  ]

  const providers = ['SendGrid', 'AWS SES', 'Mailgun', 'SparkPost', 'Postmark', 'SMTP2GO', 'Elastic', 'Private']
  const statuses = ['clean', 'blacklisted', 'warming', 'suspended']

  return Array.from({ length: count }, (_, i) => {
    const country = countries[Math.floor(Math.random() * countries.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const isBlacklisted = status === 'blacklisted'
    const reputation = isBlacklisted ? Math.random() * 30 : 70 + Math.random() * 30

    return {
      id: `smtp-${i + 1}`,
      hostname: `smtp-${i + 1}.mailer-pool.com`,
      ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      port: [25, 465, 587, 2525][Math.floor(Math.random() * 4)],
      country,
      provider: providers[Math.floor(Math.random() * providers.length)],
      status,
      ping: Math.floor(Math.random() * 200) + 10,
      speed: Math.floor(Math.random() * 900) + 100, // emails/hour
      uptime: 95 + Math.random() * 5,
      reputation,
      price: (Math.random() * 5 + 0.5).toFixed(2),
      dailyLimit: Math.floor(Math.random() * 5000) + 1000,
      currentUsage: Math.floor(Math.random() * 1000),
      lastChecked: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      ssl: Math.random() > 0.3,
      auth: Math.random() > 0.2,
      rotating: Math.random() > 0.5,
      dedicated: Math.random() > 0.7,
      selected: false
    }
  })
}

const SmtpPoolPage: React.FC = () => {
  const [smtps, setSmtps] = useState(generateMockSMTPs(1786))
  const [filteredSmtps, setFilteredSmtps] = useState(smtps)
  const [selectedSmtps, setSelectedSmtps] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 10])
  const [speedRange, setSpeedRange] = useState([0, 1000])
  const [showRotatingOnly, setShowRotatingOnly] = useState(false)
  const [showDedicatedOnly, setShowDedicatedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('ping')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [rotationInterval, setRotationInterval] = useState(30) // seconds
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [selectedPurchaseSmtp, setSelectedPurchaseSmtp] = useState<unknown>(null)

  // Auto-rotation effect
  useEffect(() => {
    if (isAutoRotating) {
      const interval = setInterval(() => {
        setSmtps(prev => {
          const rotatingSmtps = prev.filter(s => s.rotating)
          const nonRotatingSmtps = prev.filter(s => !s.rotating)

          // Shuffle rotating SMTPs
          const shuffled = [...rotatingSmtps].sort(() => Math.random() - 0.5)

          return [...shuffled, ...nonRotatingSmtps]
        })
      }, rotationInterval * 1000)

      return () => clearInterval(interval)
    }
  }, [isAutoRotating, rotationInterval])

  // Filter and sort effect
  useEffect(() => {
    let filtered = [...smtps]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.ip.includes(searchQuery) ||
        s.provider.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter(s => s.country.code === countryFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter)
    }

    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter(s => s.provider === providerFilter)
    }

    // Price range filter
    filtered = filtered.filter(s =>
      parseFloat(s.price) >= priceRange[0] && parseFloat(s.price) <= priceRange[1]
    )

    // Speed range filter
    filtered = filtered.filter(s => s.speed >= speedRange[0] && s.speed <= speedRange[1])

    // Rotating filter
    if (showRotatingOnly) {
      filtered = filtered.filter(s => s.rotating)
    }

    // Dedicated filter
    if (showDedicatedOnly) {
      filtered = filtered.filter(s => s.dedicated)
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

    setFilteredSmtps(filtered)
  }, [smtps, searchQuery, countryFilter, statusFilter, providerFilter, priceRange, speedRange, showRotatingOnly, showDedicatedOnly, sortBy, sortOrder])

  const paginatedSmtps = filteredSmtps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredSmtps.length / itemsPerPage)

  const handleSelectSmtp = (id: string) => {
    setSelectedSmtps(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedSmtps.length === paginatedSmtps.length) {
      setSelectedSmtps([])
    } else {
      setSelectedSmtps(paginatedSmtps.map(s => s.id))
    }
  }

  const handlePurchase = (smtp: unknown) => {
    setSelectedPurchaseSmtp(smtp)
    setShowPurchaseDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clean': return 'text-emerald-400'
      case 'blacklisted': return 'text-red-400'
      case 'warming': return 'text-amber-400'
      case 'suspended': return 'text-muted-foreground'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'clean': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'blacklisted': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'warming': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'suspended': return 'bg-muted/10 text-muted-foreground border-border/20'
      default: return ''
    }
  }

  const getPingColor = (ping: number) => {
    if (ping < 50) return 'text-emerald-400'
    if (ping < 100) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <StandardPageWrapper
      title="SMTP Pool Manager"
      subtitle={`${filteredSmtps.length.toLocaleString()} SMTPs available • ${selectedSmtps.length} selected`}
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

          <Button className="bg-gradient-to-r from-sky-500 to-indigo-500">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add SMTP
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
                placeholder="Search by hostname, IP, or provider..."
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
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-card/50 border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="clean">Clean</SelectItem>
              <SelectItem value="blacklisted">Blacklisted</SelectItem>
              <SelectItem value="warming">Warming</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
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
                  <Label className="text-xs text-muted-foreground">Price Range ($/1000 emails)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">${priceRange[0]}</span>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={10}
                      step={0.5}
                      className="flex-1"
                    />
                    <span className="text-sm">${priceRange[1]}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Speed Range (emails/hour)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">{speedRange[0]}</span>
                    <Slider
                      value={speedRange}
                      onValueChange={setSpeedRange}
                      max={1000}
                      step={50}
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
                  <Label className="text-xs">Dedicated Only</Label>
                  <Switch
                    checked={showDedicatedOnly}
                    onCheckedChange={setShowDedicatedOnly}
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
              className="data-[state=checked]:bg-sky-500"
            />
            {isAutoRotating && (
              <Input
                type="number"
                value={rotationInterval}
                onChange={(e) => setRotationInterval(parseInt(e.target.value))}
                className="w-16 h-8 text-xs bg-card/50 border-border"
                min="5"
                max="300"
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
                  <p className="text-xs text-muted-foreground">Total SMTPs</p>
                  <p className="text-2xl font-bold text-white">{smtps.length.toLocaleString()}</p>
                </div>
                <ServerIcon className="w-8 h-8 text-sky-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Clean Status</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {smtps.filter(s => s.status === 'clean').length.toLocaleString()}
                  </p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Speed</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round(smtps.reduce((acc, s) => acc + s.speed, 0) / smtps.length)}/hr
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
                    {Math.round(smtps.reduce((acc, s) => acc + s.ping, 0) / smtps.length)}ms
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
                    {new Set(smtps.map(s => s.country.code)).size}
                  </p>
                </div>
                <GlobeAltIcon className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Price</p>
                  <p className="text-2xl font-bold text-white">
                    ${(smtps.reduce((acc, s) => acc + parseFloat(s.price), 0) / smtps.length).toFixed(2)}
                  </p>
                </div>
                <CurrencyDollarIcon className="w-8 h-8 text-emerald-400" />
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
                checked={selectedSmtps.length === paginatedSmtps.length}
                onCheckedChange={handleSelectAll}
                className="mr-4"
              />

              <div className="flex items-center gap-4 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSortBy('hostname')
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                  className="text-xs"
                >
                  Hostname
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
                  Country
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
                {paginatedSmtps.map((smtp) => (
                  <div
                    key={smtp.id}
                    className={cn(
                      "flex items-center p-3 rounded-lg border transition-all",
                      selectedSmtps.includes(smtp.id)
                        ? "border-sky-500/50 bg-sky-500/5"
                        : "border-border hover:border-border hover:bg-card/30"
                    )}
                  >
                    <Checkbox
                      checked={selectedSmtps.includes(smtp.id)}
                      onCheckedChange={() => handleSelectSmtp(smtp.id)}
                      className="mr-4"
                    />

                    <div className="flex items-center gap-6 flex-1">
                      {/* Hostname & IP */}
                      <div className="min-w-[200px]">
                        <p className="text-sm font-medium text-white">{smtp.hostname}</p>
                        <p className="text-xs text-muted-foreground">{smtp.ip}:{smtp.port}</p>
                      </div>

                      {/* Country */}
                      <div className="min-w-[120px] flex items-center gap-2">
                        <span className="text-lg">{smtp.country.flag}</span>
                        <span className="text-sm text-muted-foreground">{smtp.country.name}</span>
                      </div>

                      {/* Provider */}
                      <div className="min-w-[100px]">
                        <Badge variant="outline" className="text-xs border-border">
                          {smtp.provider}
                        </Badge>
                      </div>

                      {/* Status */}
                      <div className="min-w-[100px]">
                        <Badge className={cn("text-xs", getStatusBadge(smtp.status))}>
                          {smtp.status === 'clean' && <CheckCircleIcon className="w-3 h-3 mr-1" />}
                          {smtp.status === 'blacklisted' && <XCircleIcon className="w-3 h-3 mr-1" />}
                          {smtp.status === 'warming' && <ClockIcon className="w-3 h-3 mr-1" />}
                          {smtp.status === 'suspended' && <ExclamationTriangleIcon className="w-3 h-3 mr-1" />}
                          {smtp.status}
                        </Badge>
                      </div>

                      {/* Ping */}
                      <div className="min-w-[80px]">
                        <div className="flex items-center gap-1">
                          <SignalIcon className={cn("w-4 h-4", getPingColor(smtp.ping))} />
                          <span className={cn("text-sm font-medium", getPingColor(smtp.ping))}>
                            {smtp.ping}ms
                          </span>
                        </div>
                      </div>

                      {/* Speed */}
                      <div className="min-w-[100px]">
                        <div className="flex items-center gap-1">
                          <BoltIcon className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-white">{smtp.speed}/hr</span>
                        </div>
                      </div>

                      {/* Reputation */}
                      <div className="min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={smtp.reputation}
                            className="h-2 flex-1"
                          />
                          <span className="text-xs text-muted-foreground">{Math.round(smtp.reputation)}%</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="min-w-[80px]">
                        <span className="text-sm font-medium text-emerald-400">
                          ${smtp.price}/1k
                        </span>
                      </div>

                      {/* Features */}
                      <div className="flex items-center gap-2 min-w-[100px]">
                        {smtp.ssl && (
                          <Badge variant="outline" className="text-xs px-1 py-0 border-emerald-500/50 text-emerald-400">
                            SSL
                          </Badge>
                        )}
                        {smtp.rotating && (
                          <Badge variant="outline" className="text-xs px-1 py-0 border-sky-500/50 text-sky-400">
                            ROT
                          </Badge>
                        )}
                        {smtp.dedicated && (
                          <Badge variant="outline" className="text-xs px-1 py-0 border-purple-500/50 text-purple-400">
                            DED
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
                            // Check SMTP functionality
                            console.log('Checking SMTP:', smtp.id)
                          }}
                        >
                          <ShieldCheckIcon className="w-4 h-4 mr-1" />
                          Check
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handlePurchase(smtp)}
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSmtps.length)} of {filteredSmtps.length} SMTPs
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
                            ? "bg-gradient-to-r from-sky-500 to-indigo-500"
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
            <DialogTitle>Purchase SMTP Access</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure your purchase for {selectedPurchaseSmtp?.hostname}
            </DialogDescription>
          </DialogHeader>

          {selectedPurchaseSmtp && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                <div>
                  <p className="text-sm font-medium">{selectedPurchaseSmtp.hostname}</p>
                  <p className="text-xs text-muted-foreground">{selectedPurchaseSmtp.ip}</p>
                </div>
                <Badge className={getStatusBadge(selectedPurchaseSmtp.status)}>
                  {selectedPurchaseSmtp.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Subscription Period</Label>
                  <Select defaultValue="monthly">
                    <SelectTrigger className="mt-1 bg-card/50 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="hourly">Hourly - ${(parseFloat(selectedPurchaseSmtp.price) * 0.1).toFixed(2)}</SelectItem>
                      <SelectItem value="daily">Daily - ${(parseFloat(selectedPurchaseSmtp.price) * 2).toFixed(2)}</SelectItem>
                      <SelectItem value="weekly">Weekly - ${(parseFloat(selectedPurchaseSmtp.price) * 12).toFixed(2)}</SelectItem>
                      <SelectItem value="monthly">Monthly - ${(parseFloat(selectedPurchaseSmtp.price) * 40).toFixed(2)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Email Volume</Label>
                  <Select defaultValue="10000">
                    <SelectTrigger className="mt-1 bg-card/50 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="1000">1,000 emails/day</SelectItem>
                      <SelectItem value="5000">5,000 emails/day</SelectItem>
                      <SelectItem value="10000">10,000 emails/day</SelectItem>
                      <SelectItem value="50000">50,000 emails/day</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">Total Cost</span>
                  <span className="text-xl font-bold text-emerald-400">
                    ${(parseFloat(selectedPurchaseSmtp.price) * 40).toFixed(2)}/mo
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
                <Button className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-500">
                  <ShoppingCartIcon className="w-4 h-4 mr-2" />
                  Purchase Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </StandardPageWrapper>
  )
}

export default SmtpPoolPage