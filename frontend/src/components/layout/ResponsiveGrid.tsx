import React from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveGridProps {
    className?: string
    children: React.ReactNode
    cols?: 1 | 2 | 3 | 4
}

const colsToClass: Record<NonNullable<ResponsiveGridProps['cols']>, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export default function ResponsiveGrid({
    className,
    children,
    cols = 3,
}: ResponsiveGridProps) {
    return (
        <div className={cn('grid gap-4', colsToClass[cols], className)}>
            {children}
        </div>
    )
}

