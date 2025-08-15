import React, { useState } from 'react'
import { motion } from 'framer-motion'
// Using MainLayout globally; no local layout wrapper
import PageConsole from '@/components/ui/PageConsole'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
// Use ActionButton for consistent controls
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { BlacklistApiFactory } from '@/api/blacklist-api'
import {
  ServerStackIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  WifiIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { Progress } from '@/components/ui/progress'
import * as CompactDataTable from "../components/CompactDataTable"
import { useProxies, useDeleteProxy, useCreateProxy, bulkUploadProxies, checkProxies } from '@/api/proxies'
import { proxyApi } from '@/http/api'
import { getSessionId } from '@/utils/getSessionId'
import { toast } from 'sonner'
import PageShell from '../components/PageShell'
// Replaced ui-kit ActionButton with standard Button variants where used
type CompactEntry = CompactDataTable.CompactEntry

export default function ProxiesPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [blDomain, setBlDomain] = useState('')
  const [blStatus, setBlStatus] = useState<string | null>(null)
  const [entries, setEntries] = useState<CompactEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const sessionId = getSessionId() || ''
  const [newHost, setNewHost] = useState('')
  const [newPort, setNewPort] = useState<number | string>(1080)
  const [newUser, setNewUser] = useState('')
  const [newPass, setNewPass] = useState('')
  const [bulkData, setBulkData] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ host: '', port: 1080 as number | string, username: '', password: '' })
  const [tags, setTags] = useState<string[]>([])
  const [pools, setPools] = useState<string[]>(['default', 'premium', 'residential'])
  const [selectedPool, setSelectedPool] = useState('default')
  const [tagInput, setTagInput] = useState('')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availablePools, setAvailablePools] = useState<string[]>([])
  // Stop conditions and threading thresholds (UI only)
  const [stopConditions, setStopConditions] = useState({
    maxErrors: 100,
    maxInvalid: 500,
    errorRatePct: 20,
    timeLimitMin: 60,
    pauseOnBlacklist: true,
    stopOnFailureSpike: true,
  })
  const [threadingCfg, setThreadingCfg] = useState({
    maxThreads: 64,
    perHost: 8,
    perIp: 16,
    rpsLimit: 50,
  })

  React.useEffect(() => {
    (async () => {
      try {
        const proxies = await listAllProxies()
        setEntries(
          (proxies || []).map((p: any) => ({
            id: String(p.id ?? p.proxy_id ?? Math.random()),
            country: p.country_code || p.country,
            host: p.ip || p.host || `${p.ip_address}`,
            user: p.username || undefined,
            pass: p.password ? '***' : undefined,
            port: p.port,
            ssl: p.ssl ?? 'TLS',
            type: p.type || 'STANDARD',
            responseMs: p.response_ms ?? p.responseMs,
            aiPrediction: p.health || p.aiPrediction,
          }))
        )
        setError(null)
      } catch (e: any) {
        setError(e?.message || 'Failed to load proxies')
      }
    })()
  }, [])

  React.useEffect(() => {
    try {
      const sc = localStorage.getItem('proxy_stop_conditions')
      const th = localStorage.getItem('proxy_threading_cfg')
      if (sc) setStopConditions({ ...stopConditions, ...JSON.parse(sc) })
      if (th) setThreadingCfg({ ...threadingCfg, ...JSON.parse(th) })
    } catch { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const saveStopConditions = () => {
    localStorage.setItem('proxy_stop_conditions', JSON.stringify(stopConditions))
  }
  const saveThreadingCfg = () => {
    localStorage.setItem('proxy_threading_cfg', JSON.stringify(threadingCfg))
  }

  React.useEffect(() => {
    if (!sessionId) return
    // Load available tags and pools
    proxyApi.getTags(sessionId).then(res => setAvailableTags(res.data || [])).catch(() => { })
    proxyApi.getPools(sessionId).then(res => setAvailablePools(res.data || ['default', 'premium', 'residential'])).catch(() => { })
  }, [sessionId])

  const metrics = [
    { label: 'Total Proxies', value: '247', icon: ServerStackIcon, color: 'cyan' },
    { label: 'Healthy', value: '234', icon: CheckCircleIcon, color: 'green' },
    { label: 'Avg Response', value: '142ms', icon: BoltIcon, color: 'blue' },
    { label: 'Success Rate', value: '98.7%', icon: ShieldCheckIcon, color: 'purple' }
  ]

  return (
    <PageShell
      title="Proxy Infrastructure Manager"
      titleIcon={
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
          <GlobeAltIcon className="w-4 h-4 text-primary neon-glow" />
        </span>
      }
      subtitle="Manage pools, run health checks, and monitor live status"
      actions={<div className="flex items-center gap-2"><Button onClick={() => setIsScanning(!isScanning)} className={isScanning ? 'animate-pulse' : ''}>{isScanning ? (<><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />Scanning...</>) : (<><ArrowPathIcon className="w-4 h-4 mr-2" />Run Health Scan</>)}</Button></div>}
      toolbar={<div className="flex items-center gap-2"><Button variant="outline"><ArrowDownTrayIcon className="w-4 h-4 mr-2 rotate-180" />Import</Button><Button variant="outline"><ArrowDownTrayIcon className="w-4 h-4 mr-2" />Export</Button></div>}
    >
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
      >
        {/* Top Monitor Console intentionally removed */}
        <div className="mb-4 flex items-center gap-4"><Badge>Online</Badge><Badge variant="outline" className="border-cyan-500/30 text-primary"><WifiIcon className="w-3 h-3 mr-1" />Real-time Monitoring</Badge><Badge variant="secondary">Health: 96</Badge></div>

        {/* Metrics Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {metrics.map((metric, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="p-4 h-full">
                <div className="flex items-center justify-between mb-2">
                  <metric.icon className="w-5 h-5 text-primary" />
                  <Badge variant="outline" className="text-xs">
                    Live
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{metric.value}</div>
                <div className="text-xs text-muted-foreground">{metric.label}</div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="hover:border-cyan-500/30 transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <GlobeAltIcon className="w-5 h-5 text-primary" />
                        Proxy Pool Management
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Scale-safe proxy orchestration with AI-powered health monitoring
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="border-white/10 hover:border-cyan-500/30"
                        onClick={async () => {
                          if (!newHost) return
                          await createProxy(sessionId, { host: newHost, port: Number(newPort) || 1080, username: newUser || undefined, password: newPass || undefined })
                          setNewHost(''); setNewPort(1080); setNewUser(''); setNewPass('')
                          try {
                            const proxies = await listAllProxies()
                            setEntries((proxies || []).map((p: any) => ({ id: String(p.id ?? p.proxy_id ?? Math.random()), country: p.country_code || p.country, host: p.ip || p.host || `${p.ip_address}`, user: p.username || undefined, pass: p.password ? '***' : undefined, port: p.port, ssl: p.ssl ?? 'TLS', type: p.type || 'STANDARD', responseMs: p.response_ms ?? p.responseMs, aiPrediction: p.health || p.aiPrediction, })))
                          } catch { }
                        }}
                      >
                        <GlobeAltIcon className="w-4 h-4 mr-2" /> Add Proxy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 hover:border-cyan-500/30"
                        onClick={async () => {
                          try {
                            setIsScanning(true)
                            await checkProxies(sessionId)
                            toast.success('Proxy bulk check started')
                          } finally {
                            setIsScanning(false)
                          }
                        }}
                      >
                        {isScanning ? (<><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />Scanning...</>) : (<><ArrowPathIcon className="w-4 h-4 mr-2" />Bulk Test</>)}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="manage" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="manage">Manage</TabsTrigger>
                      <TabsTrigger value="stop">Stop Conditions</TabsTrigger>
                      <TabsTrigger value="threads">Threading</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manage" className="space-y-3 mt-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative min-w-0 flex-1">
                          <Input
                            placeholder="Search host or tag..."
                            className="pl-3"
                          />
                        </div>
                        <Select>
                          <SelectTrigger className="w-[140px] sm:w-[160px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="healthy">Healthy</SelectItem>
                            <SelectItem value="degraded">Degraded</SelectItem>
                            <SelectItem value="down">Down</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger className="w-[140px] sm:w-[160px]">
                            <SelectValue placeholder="Region" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="us">US</SelectItem>
                            <SelectItem value="eu">EU</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" className="border-white/10 hover:border-cyan-500/30">
                          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>
                      {/* Quick Add fields */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        <Input placeholder="host/ip" value={newHost} onChange={(e) => setNewHost(e.target.value)} />
                        <Input placeholder="1080" type="number" value={newPort} onChange={(e) => setNewPort(e.target.value)} />
                        <Input placeholder="username (optional)" value={newUser} onChange={(e) => setNewUser(e.target.value)} />
                        <Input placeholder="password (optional)" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                        <Input placeholder="ip:port:user:pass per line for bulk" value={bulkData} onChange={(e) => setBulkData(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={async () => {
                          if (!bulkData.trim()) return;
                          await bulkUploadProxies(sessionId, bulkData.trim())
                          setBulkData('')
                          try {
                            const proxies = await listAllProxies()
                            setEntries((proxies || []).map((p: any) => ({ id: String(p.id ?? p.proxy_id ?? Math.random()), country: p.country_code || p.country, host: p.ip || p.host || `${p.ip_address}`, user: p.username || undefined, pass: p.password ? '***' : undefined, port: p.port, ssl: p.ssl ?? 'TLS', type: p.type || 'STANDARD', responseMs: p.response_ms ?? p.responseMs, aiPrediction: p.health || p.aiPrediction, })))
                          } catch { }
                        }}><ArrowDownTrayIcon className="w-4 h-4 mr-2 rotate-180" />Bulk Upload</Button>
                        <Button variant="outline" onClick={() => setSelectedPool(selectedPool === 'default' ? 'premium' : selectedPool === 'premium' ? 'residential' : 'default')}>
                          Pool: {selectedPool}
                        </Button>
                        <Button variant="outline" size="sm" onClick={async () => {
                          const newPool = prompt('Enter new pool name:')
                          if (newPool?.trim()) {
                            try {
                              await proxyApi.createPool(sessionId, newPool.trim())
                              setAvailablePools(prev => [...prev, newPool.trim()])
                              toast.success?.('Pool created')
                            } catch (e: any) {
                              toast.error?.(e?.message || 'Failed to create pool')
                            }
                          }
                        }}>New Pool</Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input placeholder="Add tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && tagInput.trim()) { setTags([...tags, tagInput.trim()]); setTagInput('') } }} />
                        <Button size="sm" variant="outline" onClick={() => { if (tagInput.trim()) { setTags([...tags, tagInput.trim()]); setTagInput('') } }}>Add Tag</Button>
                        <Button size="sm" variant="outline" onClick={async () => {
                          const newTag = prompt('Enter new tag:')
                          if (newTag?.trim()) {
                            setAvailableTags(prev => [...prev, newTag.trim()])
                            toast.success?.('Tag added')
                          }
                        }}>New Tag</Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                              <button onClick={() => setTags(tags.filter((_, j) => j !== i))} className="ml-1 text-muted-foreground hover:text-white">×</button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">Available tags: {availableTags.join(', ') || 'None'}</div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <CheckCircleIcon className="w-4 h-4 text-green-400" />
                          <span className="text-muted-foreground">Healthy:</span>
                          <span className="text-green-400 font-medium">234</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />
                          <span className="text-muted-foreground">Degraded:</span>
                          <span className="text-yellow-400 font-medium">8</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <GlobeAltIcon className="w-4 h-4 text-blue-400" />
                          <span className="text-muted-foreground">Regions:</span>
                          <span className="text-blue-400 font-medium">US, EU, ASIA</span>
                        </span>
                      </div>
                    </TabsContent>

                    <TabsContent value="stop" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Max Errors</Label>
                          <Input type="number" value={stopConditions.maxErrors} onChange={(e) => setStopConditions({ ...stopConditions, maxErrors: parseInt(e.target.value || '0') })} />
                        </div>
                        <div>
                          <Label>Max Invalid</Label>
                          <Input type="number" value={stopConditions.maxInvalid} onChange={(e) => setStopConditions({ ...stopConditions, maxInvalid: parseInt(e.target.value || '0') })} />
                        </div>
                        <div>
                          <Label>Error Rate %</Label>
                          <Input type="number" value={stopConditions.errorRatePct} onChange={(e) => setStopConditions({ ...stopConditions, errorRatePct: parseInt(e.target.value || '0') })} />
                        </div>
                        <div>
                          <Label>Time Limit (min)</Label>
                          <Input type="number" value={stopConditions.timeLimitMin} onChange={(e) => setStopConditions({ ...stopConditions, timeLimitMin: parseInt(e.target.value || '0') })} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch checked={stopConditions.pauseOnBlacklist} onCheckedChange={(v) => setStopConditions({ ...stopConditions, pauseOnBlacklist: v })} id="proxy-pause-on-bl" />
                          <Label htmlFor="proxy-pause-on-bl">Pause on blacklist hits</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={stopConditions.stopOnFailureSpike} onCheckedChange={(v) => setStopConditions({ ...stopConditions, stopOnFailureSpike: v })} id="proxy-stop-on-failure" />
                          <Label htmlFor="proxy-stop-on-failure">Stop on failure spike</Label>
                        </div>
                      </div>
                      <div className="text-right">
                        <Button size="sm" variant="outline" onClick={saveStopConditions}>Save</Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="threads" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Max Threads</Label>
                          <Input type="number" min={1} max={256} value={threadingCfg.maxThreads} onChange={(e) => setThreadingCfg({ ...threadingCfg, maxThreads: parseInt(e.target.value || '1') })} />
                        </div>
                        <div>
                          <Label>Per Host</Label>
                          <Input type="number" min={1} max={64} value={threadingCfg.perHost} onChange={(e) => setThreadingCfg({ ...threadingCfg, perHost: parseInt(e.target.value || '1') })} />
                        </div>
                        <div>
                          <Label>Per IP</Label>
                          <Input type="number" min={1} max={128} value={threadingCfg.perIp} onChange={(e) => setThreadingCfg({ ...threadingCfg, perIp: parseInt(e.target.value || '1') })} />
                        </div>
                        <div>
                          <Label>RPS Limit</Label>
                          <Input type="number" min={1} max={1000} value={threadingCfg.rpsLimit} onChange={(e) => setThreadingCfg({ ...threadingCfg, rpsLimit: parseInt(e.target.value || '1') })} />
                        </div>
                      </div>
                      <div className="text-right">
                        <Button size="sm" variant="outline" onClick={saveThreadingCfg}>Save</Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            {/* Data Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {error && (
                <div className="text-destructive text-sm mb-2">{error}</div>
              )}
              <div className="rounded-lg border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2">Host</th>
                      <th className="px-4 py-2">Port</th>
                      <th className="px-4 py-2">User</th>
                      <th className="px-4 py-2">Country</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr><td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={6}>No proxies</td></tr>
                    ) : entries.map((e) => (
                      <tr key={e.id} className="hover:bg-white/5">
                        <td className="px-4 py-2 text-sm text-white">{e.host}</td>
                        <td className="px-4 py-2 text-sm">{e.port}</td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">{e.user || '-'}</td>
                        <td className="px-4 py-2 text-sm">{e.country || '-'}</td>
                        <td className="px-4 py-2 text-sm">{e.type || '-'}</td>
                        <td className="px-4 py-2 text-right">
                          <Button size="sm" variant="outline" className="mr-2" onClick={() => { setEditId(String(e.id)); setEditForm({ host: e.host, port: e.port || 1080, username: e.user || '', password: '' }) }}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={async () => { try { await deleteProxy(sessionId, String(e.id)); const proxies = await listAllProxies(); setEntries((proxies || []).map((p: any) => ({ id: String(p.id ?? p.proxy_id ?? Math.random()), country: p.country_code || p.country, host: p.ip || p.host || `${p.ip_address}`, user: p.username || undefined, pass: p.password ? '***' : undefined, port: p.port, ssl: p.ssl ?? 'TLS', type: p.type || 'STANDARD', responseMs: p.response_ms ?? p.responseMs, aiPrediction: p.health || p.aiPrediction, }))) } catch { } }}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* Sidebar with Console */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Small live proxy console using shadcn PageConsole */}
            <PageConsole
              title="Proxy Live Health"
              source="proxies"
              height="lg"
              showDetails={false}
              logCategories={["STATUS", "TEST", "ROTATION", "ERROR", "HEALTH"]}
              wsUrl={`ws://localhost:8000/ws/proxies/${sessionId}`}
              initialLogs={[
                { timestamp: new Date().toISOString(), level: 'info', message: 'Proxy health monitoring started', category: 'HEALTH' },
                { timestamp: new Date().toISOString(), level: 'info', message: `Monitoring ${entries.length} proxies`, category: 'STATUS' }
              ]}
            />

            {/* Quick Stats */}
            <Card className="hover:border-cyan-500/30 transition-all">
              <CardHeader>
                <CardTitle className="text-sm text-foreground flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-primary" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Bandwidth</span>
                    <span className="text-foreground">2.4 TB/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Latency</span>
                    <span className="text-foreground">142ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Success Rate</span>
                    <Badge variant="outline" className="border-green-500/30 text-green-400">98.7%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Regions</span>
                    <span className="text-blue-400">12 countries</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Pools</span>
                    <span className="text-foreground">{pools.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tags</span>
                    <span className="text-foreground">{tags.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Blacklist Check */}
            <Card className="hover:border-cyan-500/30 transition-all">
              <CardHeader>
                <CardTitle className="text-sm text-foreground flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-primary" />
                  Quick Blacklist Check
                </CardTitle>
                <CardDescription>Check a sending domain against reputation lists</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="bl-domain">Domain</Label>
                    <Input id="bl-domain" placeholder="example.com" value={blDomain} onChange={(e) => setBlDomain(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={async () => {
                      if (!blDomain.trim()) return
                      setBlStatus('Checking...')
                      try {
                        const api = BlacklistApiFactory()
                        const res = await api.checkDomainBlacklistApiV1BlacklistBlacklistDomainDomainGet(blDomain.trim())
                        const data = (res as any)?.data ?? res
                        const bad = Array.isArray(data?.hits) ? data.hits.length : (data?.blacklisted ? 1 : 0)
                        setBlStatus(bad ? `Listed on ${bad} lists` : 'Not listed')
                      } catch (e: any) {
                        setBlStatus('Check failed')
                      }
                    }}>Check</Button>
                    {blStatus && (
                      <Badge variant={blStatus.includes('Not') ? 'outline' : 'destructive'}>{blStatus}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Edit inline row */}
        {editId && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Edit Proxy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input placeholder="host/ip" value={editForm.host} onChange={(e) => setEditForm({ ...editForm, host: e.target.value })} />
                <Input placeholder="1080" type="number" value={editForm.port} onChange={(e) => setEditForm({ ...editForm, port: e.target.value })} />
                <Input placeholder="username (optional)" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
                <Input placeholder="password (optional)" type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
                <Button onClick={async () => {
                  try {
                    // No dedicated update API provided; use delete + create as fallback
                    await deleteProxy(sessionId, editId)
                    await createProxy(sessionId, { host: editForm.host, port: Number(editForm.port) || 1080, username: editForm.username || undefined, password: editForm.password || undefined })
                    setEditId(null)
                    const proxies = await listAllProxies()
                    setEntries((proxies || []).map((p: any) => ({ id: String(p.id ?? p.proxy_id ?? Math.random()), country: p.country_code || p.country, host: p.ip || p.host || `${p.ip_address}`, user: p.username || undefined, pass: p.password ? '***' : undefined, port: p.port, ssl: p.ssl ?? 'TLS', type: p.type || 'STANDARD', responseMs: p.response_ms ?? p.responseMs, aiPrediction: p.health || p.aiPrediction, })))
                  } catch { }
                }}>Save</Button>
              </div>
            </CardContent>
          </Card>
        )}

      </motion.div>
    </PageShell>
  )
}
