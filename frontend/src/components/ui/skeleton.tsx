"use client"

import type React from 'react'
import SkeletonLib from 'react-loading-skeleton'
// Use only global styles; avoid importing third-party CSS that overrides tokens
import { cn } from '@/utils/cn'

interface SkeletonProps extends React.ComponentProps<typeof SkeletonLib> {
  containerClassName?: string
}

export function Skeleton({ containerClassName, className, ...props }: SkeletonProps) {
  return (
    <SkeletonLib
      baseColor="var(--skeleton-base)"
      highlightColor="var(--skeleton-highlight)"
      containerClassName={cn('overflow-hidden rounded-md', containerClassName)}
      className={className}
      {...props}
    />
  )
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return <Skeleton count={lines} className={cn('mb-2 last:mb-0', className)} />
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-neutral-700/50 bg-neutral-800/30 p-6', className)}>
      <Skeleton height={24} width="40%" className="mb-2" />
      <Skeleton height={16} width="60%" />
      <div className="mt-4 space-y-2">
        <Skeleton height={14} />
        <Skeleton height={14} />
        <Skeleton height={14} width="80%" />
      </div>
    </div>
  )
}

export function SkeletonButton({ className, size = 'default' }: { className?: string; size?: 'default' | 'sm' | 'lg' }) {
  const sizes = { default: 'h-10 w-24', sm: 'h-9 w-20', lg: 'h-11 w-28' }
  return <Skeleton className={cn('rounded-md', sizes[size], className)} />
}

export function SkeletonAvatar({ className, size = 'default' }: { className?: string; size?: 'sm' | 'default' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8', default: 'h-10 w-10', lg: 'h-12 w-12' }
  return <Skeleton className={cn('rounded-full', sizes[size], className)} />
}

export function SkeletonTable({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={16} className="flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height={16} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export default Skeleton
