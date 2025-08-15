import React from 'react'
import { cn } from '@/lib/utils'

interface StandardPageWrapperProps {
    title: string
    subtitle?: string
    children: React.ReactNode
    className?: string
    showComingSoon?: boolean
    comingSoonText?: string
    actions?: React.ReactNode
    headerClassName?: string
    contentClassName?: string
}

const StandardPageWrapper: React.FC<StandardPageWrapperProps> = ({
    title,
    subtitle,
    children,
    className,
    showComingSoon = false,
    comingSoonText = "COMING SOON",
    actions,
    headerClassName,
    contentClassName
}) => {
    return (
        <div className={cn("flex flex-col h-full bg-gradient-dark relative", className)}>
            {/* Coming Soon Badge */}
            {showComingSoon && (
                <div className="absolute top-4 right-4 z-50">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-lg font-bold shadow-lg rounded-md">
                        {comingSoonText}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={cn("px-6 py-4 border-b border-border bg-background/50", headerClassName)}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {actions && (
                        <div className="flex items-center gap-3">
                            {actions}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className={cn("flex-1 overflow-auto", contentClassName)}>
                {children}
            </div>
        </div>
    )
}

export default StandardPageWrapper
