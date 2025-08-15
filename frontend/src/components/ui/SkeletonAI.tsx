import React from 'react'
import PremiumMailLoader from './PremiumMailLoader'
import CircularTransitionLoader from './CircularTransitionLoader'

type SkeletonAIProps = {
  variant?: 'default' | 'sidebar';
}

export default function SkeletonAI({ variant = 'default' }: SkeletonAIProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced magical background with circular transition */}
      <div className="pointer-events-none absolute inset-0">
        {/* Animated background grid with darker/magical theme */}
        <div className="absolute inset-0 opacity-30 [mask-image:radial-gradient(600px_400px_at_50%_0%,black,transparent)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(139,92,246,0.12),transparent_40%)]"/>
          <div className="absolute inset-0 bg-[linear-gradient(transparent,transparent_31px,rgba(96,165,250,0.06)_32px),linear-gradient(90deg,transparent,transparent_31px,rgba(139,92,246,0.04)_32px)] bg-[length:32px_32px]"/>
        </div>

        {/* Circular transition background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-60">
          <CircularTransitionLoader size="fullscreen" variant="magical" />
        </div>
      </div>

      {/* Premium Mail Loader centered */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <PremiumMailLoader 
          size="md" 
          variant="full" 
          showText={true} 
          text="Loading MailerSuite..." 
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 space-y-8 animate-in fade-in zoom-in-50 opacity-20">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-8 w-56 rounded-md bg-muted/80 animate-pulse" />
            <div className="h-4 w-80 rounded-md bg-muted/60 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-28 rounded-md bg-muted/80 animate-pulse" />
            <div className="h-10 w-28 rounded-md bg-muted/80 animate-pulse" />
          </div>
        </div>

        <div className={variant === 'sidebar' ? 'grid grid-cols-4 gap-6' : ''}>
          {/* Main column */}
          <div className={variant === 'sidebar' ? 'col-span-3 space-y-6' : 'space-y-6'}>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted/80 animate-pulse" />
                    <div className="space-y-2 w-full">
                      <div className="h-5 w-24 rounded bg-muted/80 animate-pulse" />
                      <div className="h-4 w-36 rounded bg-muted/60 animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-muted/50 animate-pulse" />
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="h-9 w-64 rounded-md bg-muted/80 animate-pulse" />
                <div className="h-9 w-44 rounded-md bg-muted/80 animate-pulse" />
                <div className="h-9 w-44 rounded-md bg-muted/80 animate-pulse" />
                <div className="h-9 w-28 rounded-md bg-muted/80 animate-pulse" />
                <div className="h-9 w-28 rounded-md bg-muted/80 animate-pulse" />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
              <div className="border-b border-border h-10 bg-muted/30" />
              <div className="divide-y divide-border">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-7 gap-4 p-4">
                    <div className="h-4 bg-muted/80 rounded w-40 animate-pulse" />
                    <div className="h-4 bg-muted/80 rounded w-24 animate-pulse" />
                    <div className="h-4 bg-muted/80 rounded w-24 animate-pulse" />
                    <div className="h-4 bg-muted/80 rounded w-24 animate-pulse" />
                    <div className="h-4 bg-muted/80 rounded w-64 animate-pulse" />
                    <div className="h-2 bg-muted/70 rounded w-28 self-center animate-pulse" />
                    <div className="h-8 bg-muted/80 rounded w-16 justify-self-end animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar column */}
          {variant === 'sidebar' && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <div className="h-5 w-40 bg-muted/80 rounded animate-pulse mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-3 w-full bg-muted/70 rounded animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <div className="h-5 w-48 bg-muted/80 rounded animate-pulse mb-4" />
                <div className="h-40 w-full bg-muted/60 rounded animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
