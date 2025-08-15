/**
 * 🚀 Enhancement Templates for Streamlined Component Transformation
 * Reusable templates for transforming all 50+ page directories efficiently
 * Built with StreamlinedDesignSystem for maximum consistency
 */

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  StreamlinedCard,
  StreamlinedConsole,
  StreamlinedTable,
  StreamlinedMetric,
  StreamlinedPageHeader,
  StreamlinedGrid,
  StreamlinedButton,
  streamlinedAnimations
} from '@/components/client/StreamlinedDesignSystem'
import { ThemeToggle } from '@/components/client/ThemeProvider'
import {
  Activity,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Mail,
  BarChart3
} from 'lucide-react'

/* ============================================================================ */
/* CONSOLE INTERFACE TEMPLATE */
/* ============================================================================ */

interface ConsoleTemplateProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  logs: Array<{
    id: string
    timestamp: string
    level: 'info' | 'success' | 'error' | 'warning'
    message: string
  }>
  isRunning?: boolean
  onStart?: () => void
  onStop?: () => void
  onClear?: () => void
  children?: React.ReactNode
}

export function EnhancedConsoleTemplate({
  title,
  subtitle,
  icon,
  logs,
  isRunning = false,
  onStart,
  onStop,
  onClear,
  children
}: ConsoleTemplateProps) {
  return (
    <motion.div
      className="min-h-screen bg-background relative overflow-hidden"
      variants={streamlinedAnimations.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb" />
        <div className="floating-orb" />
        <div className="floating-orb floating-orb-3" />
      </div>

      {/* Header */}
      <StreamlinedPageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {onStart && onStop && (
              <StreamlinedButton
                variant={isRunning ? "outline" : "default"}
                size="sm"
                onClick={isRunning ? onStop : onStart}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </StreamlinedButton>
            )}
            <StreamlinedButton variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </StreamlinedButton>
          </div>
        }
      />

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {children}

        {/* Console Output */}
        <StreamlinedCard variant="console" padding="none">
          <div className="p-3 border-b border-border dark:border-border/30 flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              {icon}
              Live Console
            </h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
              {onClear && (
                <StreamlinedButton variant="ghost" size="sm" onClick={onClear}>
                  Clear
                </StreamlinedButton>
              )}
            </div>
          </div>
          <StreamlinedConsole
            logs={logs}
            height="300px"
            maxLines={50}
            animated={true}
          />
        </StreamlinedCard>
      </div>
    </motion.div>
  )
}

/* ============================================================================ */
/* DATA TABLE TEMPLATE */
/* ============================================================================ */

interface TableTemplateProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  data: Array<Record<string, any>>
  headers: string[]
  loading?: boolean
  searchable?: boolean
  filterable?: boolean
  actions?: {
    label: string
    icon: React.ReactNode
    onClick: () => void
    variant?: 'default' | 'outline' | 'ghost'
  }[]
  onRowAction?: (row: any, action: string) => void
  children?: React.ReactNode
}

export function EnhancedTableTemplate({
  title,
  subtitle,
  icon,
  data,
  headers,
  loading = false,
  searchable = true,
  filterable = true,
  actions = [],
  onRowAction,
  children
}: TableTemplateProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  const filteredData = data.filter(row =>
    searchTerm === '' ||
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <motion.div
      className="min-h-screen bg-background relative overflow-hidden"
      variants={streamlinedAnimations.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb" />
        <div className="floating-orb" />
        <div className="floating-orb floating-orb-3" />
      </div>

      {/* Header */}
      <StreamlinedPageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {actions.map((action, index) => (
              <StreamlinedButton
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
              >
                {action.icon}
                {action.label}
              </StreamlinedButton>
            ))}
          </div>
        }
      />

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {children}

        {/* Search and Filters */}
        {(searchable || filterable) && (
          <StreamlinedCard variant="clean" padding="md">
            <div className="flex items-center gap-4">
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 rounded-md border border-border dark:border-border bg-background/50 backdrop-blur-sm text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}

              {selectedRows.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{selectedRows.length} selected</span>
                  <StreamlinedButton variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </StreamlinedButton>
                  <StreamlinedButton variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </StreamlinedButton>
                </div>
              )}
            </div>
          </StreamlinedCard>
        )}

        {/* Data Table */}
        <StreamlinedTable
          headers={headers}
          data={filteredData}
          loading={loading}
          animated={true}
          maxHeight="500px"
        />
      </div>
    </motion.div>
  )
}

/* ============================================================================ */
/* ANALYTICS DASHBOARD TEMPLATE */
/* ============================================================================ */

interface AnalyticsTemplateProps {
  title: string
  subtitle: string
  metrics: Array<{
    label: string
    value: string | number
    trend?: {
      direction: 'up' | 'down' | 'neutral'
      value: string
    }
    icon: React.ReactNode
    variant?: 'default' | 'minimal' | 'accent'
  }>
  charts?: Array<{
    title: string
    type: 'line' | 'bar' | 'pie'
    data: any[]
  }>
  children?: React.ReactNode
}

export function EnhancedAnalyticsTemplate({
  title,
  subtitle,
  metrics,
  charts = [],
  children
}: AnalyticsTemplateProps) {
  return (
    <motion.div
      className="min-h-screen bg-background relative overflow-hidden"
      variants={streamlinedAnimations.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb" />
        <div className="floating-orb" />
        <div className="floating-orb floating-orb-3" />
      </div>

      {/* Header */}
      <StreamlinedPageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <StreamlinedButton variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </StreamlinedButton>
            <StreamlinedButton variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </StreamlinedButton>
          </div>
        }
      />

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* Metrics Grid */}
        <StreamlinedGrid className={`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`}>
          {metrics.map((metric, index) => (
            <StreamlinedMetric
              key={index}
              label={metric.label}
              value={metric.value}
              trend={metric.trend}
              icon={metric.icon}
              variant={metric.variant}
            />
          ))}
        </StreamlinedGrid>

        {children}

        {/* Charts */}
        {charts.length > 0 && (
          <StreamlinedGrid className={`grid-cols-1 lg:grid-cols-2`}>
            {charts.map((chart, index) => (
              <StreamlinedCard key={index} variant="minimal" padding="md">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  {chart.title}
                </h3>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{chart.type.charAt(0).toUpperCase() + chart.type.slice(1)} Chart</p>
                    <p className="text-xs">({chart.data.length} data points)</p>
                  </div>
                </div>
              </StreamlinedCard>
            ))}
          </StreamlinedGrid>
        )}
      </div>
    </motion.div>
  )
}

/* ============================================================================ */
/* MANAGEMENT INTERFACE TEMPLATE */
/* ============================================================================ */

interface ManagementTemplateProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  items: Array<{
    id: string
    name: string
    status: string
    description?: string
    lastUpdated?: string
    metrics?: Record<string, any>
  }>
  onItemAction?: (itemId: string, action: string) => void
  createAction?: {
    label: string
    onClick: () => void
  }
  children?: React.ReactNode
}

export function EnhancedManagementTemplate({
  title,
  subtitle,
  icon,
  items,
  onItemAction,
  createAction,
  children
}: ManagementTemplateProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'running':
      case 'online':
        return 'text-green-500 bg-green-500/10'
      case 'inactive':
      case 'stopped':
      case 'offline':
        return 'text-red-500 bg-red-500/10'
      case 'pending':
      case 'loading':
        return 'text-yellow-500 bg-yellow-500/10'
      default:
        return 'text-muted-foreground bg-muted/10'
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-background relative overflow-hidden"
      variants={streamlinedAnimations.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb" />
        <div className="floating-orb" />
        <div className="floating-orb floating-orb-3" />
      </div>

      {/* Header */}
      <StreamlinedPageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <StreamlinedButton variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </StreamlinedButton>
            {createAction && (
              <StreamlinedButton variant="default" size="sm" onClick={createAction.onClick}>
                <Plus className="w-4 h-4 mr-2" />
                {createAction.label}
              </StreamlinedButton>
            )}
          </div>
        }
      />

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {children}

        {/* Summary Metrics */}
        <StreamlinedGrid className="grid-cols-1 md:grid-cols-4">
          <StreamlinedMetric
            label="Total Items"
            value={items.length}
            icon={icon}
            variant="accent"
          />
          <StreamlinedMetric
            label="Active"
            value={items.filter(i => ['active', 'running', 'online'].includes(i.status.toLowerCase())).length}
            icon={<CheckCircle className="w-4 h-4" />}
          />
          <StreamlinedMetric
            label="Inactive"
            value={items.filter(i => ['inactive', 'stopped', 'offline'].includes(i.status.toLowerCase())).length}
            icon={<XCircle className="w-4 h-4" />}
          />
          <StreamlinedMetric
            label="Selected"
            value={selectedItems.length}
            icon={<Target className="w-4 h-4" />}
          />
        </StreamlinedGrid>

        {/* Search and Actions */}
        <StreamlinedCard variant="clean" padding="md">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search items..."
                className="pl-10 pr-4 py-2 w-full rounded-md border border-border dark:border-border bg-background/50 backdrop-blur-sm text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{selectedItems.length} selected</span>
                <StreamlinedButton variant="outline" size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </StreamlinedButton>
                <StreamlinedButton variant="outline" size="sm">
                  <Pause className="w-4 h-4 mr-2" />
                  Stop
                </StreamlinedButton>
                <StreamlinedButton variant="outline" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </StreamlinedButton>
              </div>
            )}
          </div>
        </StreamlinedCard>

        {/* Items Grid */}
        <StreamlinedGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                variants={streamlinedAnimations.fadeInUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ delay: index * 0.05 }}
              >
                <StreamlinedCard
                  variant="minimal"
                  padding="md"
                  className="cursor-pointer hover:border-primary/50 transition-all"
                  onClick={() => {
                    setSelectedItems(prev =>
                      prev.includes(item.id)
                        ? prev.filter(id => id !== item.id)
                        : [...prev, item.id]
                    )
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => { }}
                        className="rounded border-border dark:border-border"
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {item.metrics && (
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      {Object.entries(item.metrics).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="ml-1 font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.lastUpdated && (
                    <div className="text-xs text-muted-foreground mb-3">
                      Updated: {new Date(item.lastUpdated).toLocaleString()}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <StreamlinedButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onItemAction?.(item.id, 'edit')
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </StreamlinedButton>
                    <StreamlinedButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onItemAction?.(item.id, 'view')
                      }}
                    >
                      <Eye className="w-3 h-3" />
                    </StreamlinedButton>
                    <StreamlinedButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onItemAction?.(item.id, 'delete')
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </StreamlinedButton>
                  </div>
                </StreamlinedCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </StreamlinedGrid>
      </div>
    </motion.div>
  )
}

/* ============================================================================ */
/* EXPORTS */
/* ============================================================================ */

export {
  EnhancedConsoleTemplate,
  EnhancedTableTemplate,
  EnhancedAnalyticsTemplate,
  EnhancedManagementTemplate
}