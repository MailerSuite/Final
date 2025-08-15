import React from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

export interface TooltipOptions {
  label?: string
  placeholder?: string
  ariaLabel?: string
  children?: React.ReactNode
  elementType?:
    | 'button'
    | 'input'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'switch'
    | 'toggle'
    | string
}

export function generateTooltipText({
  label,
  placeholder,
  ariaLabel,
  children,
  elementType,
}: TooltipOptions): string {
  const baseText =
    label ||
    placeholder ||
    ariaLabel ||
    (typeof children === 'string' ? children : '')

  if (!baseText) return ''

  const normalized = baseText.replace(/[:*]/g, '').trim()
  const lower = normalized.toLowerCase()

  switch (elementType) {
    case 'button':
    case 'link':
      return `Click to ${normalized}`
    case 'input':
    case 'textarea':
      return `Enter your ${lower}`
    case 'select':
    case 'radio':
      return `Select ${lower}`
    case 'checkbox':
    case 'switch':
    case 'toggle':
      return `Toggle ${lower} on/off`
    default:
      return normalized
  }
}

export interface WithTooltipProps {
  label?: string
  placeholder?: string
  'aria-label'?: string
  children?: React.ReactNode
}

export function withTooltip<P extends WithTooltipProps>(
  Component: React.ComponentType<P>,
  elementType?: TooltipOptions['elementType']
) {
  return function TooltipComponent({ tooltip, ...props }: P & { tooltip?: boolean | string }) {
    let tooltipText: string | null = null

    if (tooltip === false) {
      tooltipText = null
    } else if (typeof tooltip === 'string') {
      tooltipText = tooltip
    } else {
      tooltipText = generateTooltipText({
        label: props.label,
        placeholder: props.placeholder,
        ariaLabel: props['aria-label'],
        children: props.children,
        elementType,
      })
    }

    const element = React.createElement(Component, props as P)

    return tooltipText
      ? React.createElement(
          Tooltip,
          null,
          React.createElement(TooltipTrigger, { asChild: true }, element),
          React.createElement(TooltipContent, null, tooltipText)
        )
      : element
  }
}
