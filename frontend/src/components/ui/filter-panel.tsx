import React from 'react'
import { Filter, X, ChevronDown, Calendar, Hash, Type, Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-time-picker'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export interface FilterOption {
  key: string
  label: string
  value: any
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean'
  options?: { label: string; value: any }[]
  placeholder?: string
}

export interface ActiveFilter {
  key: string
  label: string
  value: any
  displayValue: string
}

interface FilterPanelProps {
  filters: FilterOption[]
  activeFilters: Record<string, any>
  onFiltersChange: (filters: Record<string, any>) => void
  onReset?: () => void
  className?: string
  variant?: 'popover' | 'inline' | 'sidebar'
  trigger?: React.ReactNode
  title?: string
  showActiveCount?: boolean
  collapsible?: boolean
  defaultOpen?: boolean
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  activeFilters,
  onFiltersChange,
  onReset,
  className,
  variant = 'popover',
  trigger,
  title = 'Filters',
  showActiveCount = true,
  collapsible = true,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set())

  const activeFilterCount = Object.keys(activeFilters).filter(key => {
    const value = activeFilters[key]
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'string') return value.trim() !== ''
    return value !== null && value !== undefined && value !== ''
  }).length

  const getActiveFiltersList = (): ActiveFilter[] => {
    return Object.entries(activeFilters)
      .filter(([key, value]) => {
        if (Array.isArray(value)) return value.length > 0
        if (typeof value === 'string') return value.trim() !== ''
        return value !== null && value !== undefined && value !== ''
      })
      .map(([key, value]) => {
        const filter = filters.find(f => f.key === key)
        if (!filter) return null

        let displayValue: string
        switch (filter.type) {
          case 'multiselect':
            displayValue = Array.isArray(value) 
              ? value.map(v => filter.options?.find(o => o.value === v)?.label || v).join(', ')
              : String(value)
            break
          case 'select':
            displayValue = filter.options?.find(o => o.value === value)?.label || String(value)
            break
          case 'date':
            displayValue = value instanceof Date ? value.toLocaleDateString() : String(value)
            break
          case 'daterange':
            if (Array.isArray(value) && value.length === 2) {
              const [start, end] = value
              displayValue = `${start?.toLocaleDateString()} - ${end?.toLocaleDateString()}`
            } else {
              displayValue = String(value)
            }
            break
          case 'boolean':
            displayValue = value ? 'Yes' : 'No'
            break
          default:
            displayValue = String(value)
        }

        return {
          key,
          label: filter.label,
          value,
          displayValue,
        }
      })
      .filter(Boolean) as ActiveFilter[]
  }

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ ...activeFilters, [key]: value })
  }

  const removeFilter = (key: string) => {
    const newFilters = { ...activeFilters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  const handleReset = () => {
    onFiltersChange({})
    if (onReset) onReset()
  }

  const toggleSection = (key: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedSections(newExpanded)
  }

  const renderFilterInput = (filter: FilterOption) => {
    const value = activeFilters[filter.key]

    switch (filter.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            className="w-full"
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            className="w-full"
          />
        )

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(newValue) => handleFilterChange(filter.key, newValue)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filter.key}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleFilterChange(filter.key, [...selectedValues, option.value])
                    } else {
                      handleFilterChange(filter.key, selectedValues.filter(v => v !== option.value))
                    }
                  }}
                />
                <Label
                  htmlFor={`${filter.key}-${option.value}`}
                  className="text-sm cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        )

      case 'date':
        return (
          <DatePicker
            value={value}
            onChange={(date) => handleFilterChange(filter.key, date)}
            placeholder={filter.placeholder}
            className="w-full"
          />
        )

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={filter.key}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleFilterChange(filter.key, checked)}
            />
            <Label htmlFor={filter.key} className="text-sm cursor-pointer">
              {filter.label}
            </Label>
          </div>
        )

      default:
        return null
    }
  }

  const FilterContent = () => (
    <div className={cn('space-y-4', variant === 'sidebar' && 'p-4')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <Filter className="w-4 h-4" />
          {title}
          {showActiveCount && activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-6 px-2 text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Active Filters */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <Label className="text-xs text-muted-foreground">Active Filters:</Label>
            <div className="flex flex-wrap gap-1">
              {getActiveFiltersList().map((filter) => (
                <Badge
                  key={filter.key}
                  variant="secondary"
                  className="text-xs px-2 py-1 group hover:bg-destructive/10 transition-colors"
                >
                  <span className="max-w-[120px] truncate">
                    {filter.label}: {filter.displayValue}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1 opacity-60 group-hover:opacity-100 hover:text-destructive"
                    onClick={() => removeFilter(filter.key)}
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </Badge>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Options */}
      <div className="space-y-3">
        {filters.map((filter) => (
          <div key={filter.key} className="space-y-2">
            {collapsible ? (
              <Collapsible
                open={expandedSections.has(filter.key)}
                onOpenChange={() => toggleSection(filter.key)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto font-normal text-left"
                  >
                    <Label className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      {filter.type === 'text' && <Type className="w-3 h-3" />}
                      {filter.type === 'number' && <Hash className="w-3 h-3" />}
                      {(filter.type === 'date' || filter.type === 'daterange') && <Calendar className="w-3 h-3" />}
                      {filter.type === 'boolean' && <Check className="w-3 h-3" />}
                      {filter.label}
                    </Label>
                    <ChevronDown className="w-4 h-4 transition-transform data-[state=open]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  {renderFilterInput(filter)}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                <Label className="text-sm font-medium flex items-center gap-2">
                  {filter.type === 'text' && <Type className="w-3 h-3" />}
                  {filter.type === 'number' && <Hash className="w-3 h-3" />}
                  {(filter.type === 'date' || filter.type === 'daterange') && <Calendar className="w-3 h-3" />}
                  {filter.type === 'boolean' && <Check className="w-3 h-3" />}
                  {filter.label}
                </Label>
                {renderFilterInput(filter)}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  if (variant === 'inline' || variant === 'sidebar') {
    return (
      <div className={cn('border border-border rounded-lg', className)}>
        <FilterContent />
      </div>
    )
  }

  // Popover variant
  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Filter className="w-4 h-4" />
      Filters
      {showActiveCount && activeFilterCount > 0 && (
        <Badge variant="secondary" className="text-xs ml-1">
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  )

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent 
        className={cn('w-80 p-4 glass-card', className)} 
        align="start"
      >
        <FilterContent />
      </PopoverContent>
    </Popover>
  )
}

// Quick filter buttons for common filters
interface QuickFiltersProps {
  filters: { label: string; key: string; value: any }[]
  activeFilters: Record<string, any>
  onFilterToggle: (key: string, value: any) => void
  className?: string
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  filters,
  activeFilters,
  onFilterToggle,
  className,
}) => {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {filters.map((filter) => {
        const isActive = activeFilters[filter.key] === filter.value
        return (
          <Button
            key={`${filter.key}-${filter.value}`}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterToggle(filter.key, isActive ? undefined : filter.value)}
            className="h-8 text-xs"
          >
            {filter.label}
          </Button>
        )
      })}
    </div>
  )
}

export default FilterPanel