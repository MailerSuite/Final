import React from 'react'
import { cn } from '@/lib/utils'

export interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  enable3D?: boolean
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  enable3D = false,
  className,
  children,
  ...rest
}) => {
  const content = (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-[#121212]/80 text-white',
        'backdrop-blur supports-[backdrop-filter]:bg-[#121212]/60',
        'p-4 md:p-6 transition-colors',
        'hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )

  // 3D effect disabled for consistency
  return content
}

export default AnimatedCard
