import React from 'react'
import { Badge } from '@/components/ui/badge'

/**
 * Small badge to indicate a visual-only or upcoming feature.
 */
export const SoonBadge: React.FC<{ className?: string; label?: string }> = ({ className, label = 'SOON' }) => (
  <Badge
    variant="outline"
    className={['text-[10px] px-1.5 py-0 align-middle ml-2 bg-amber-500/10 text-amber-400 border-amber-400/30', className].filter(Boolean).join(' ')}
    title="Visual-only preview"
  >
    {label}
  </Badge>
)

export default SoonBadge
