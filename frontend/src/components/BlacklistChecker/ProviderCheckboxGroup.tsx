import { Checkbox } from '@/components/ui/checkbox'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import React from 'react'

export interface ProviderInfo {
  id: string
  name: string
  description: string
  logo?: React.ReactNode
}

interface Props {
  providers: ProviderInfo[]
  value: string[]
  onChange(value: string[]): void
}

export default function ProviderCheckboxGroup({ providers, value, onChange }: Props) {
  const allSelected = value.length === providers.length

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }

  const toggleAll = () => {
    onChange(allSelected ? [] : providers.map(p => p.id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Providers</span>
        <Toggle pressed={allSelected} onPressedChange={toggleAll} aria-label="Toggle all">
          {allSelected ? 'Deselect All' : 'Select All'}
        </Toggle>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        {providers.map(p => (
          <label key={p.id} className="flex items-center gap-2 text-sm">
            <Checkbox checked={value.includes(p.id)} onCheckedChange={() => toggle(p.id)} id={p.id} />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 cursor-help">
                  {p.logo}
                  {p.name}
                </span>
              </TooltipTrigger>
              <TooltipContent>{p.description}</TooltipContent>
            </Tooltip>
          </label>
        ))}
      </div>
    </div>
  )
}
