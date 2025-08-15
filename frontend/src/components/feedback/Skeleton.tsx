import { cn } from '@/lib/utils'

export default function Skeleton({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('animate-pulse space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-skeleton-base rounded" />
      ))}
    </div>
  )
}
