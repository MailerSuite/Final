import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface PageShellProps {
    title: string
    titleIcon?: React.ReactNode
    subtitle?: string
    actions?: React.ReactNode
    children: React.ReactNode
    breadcrumbs?: Array<{ label: string; href?: string }>
    toolbar?: React.ReactNode
    className?: string
    compact?: boolean
}

export default function PageShell({
    title,
    titleIcon,
    subtitle,
    actions,
    children,
    breadcrumbs = [],
    toolbar,
    className,
    compact = false
}: PageShellProps) {
    return (
        <div className={cn("space-y-6", className)}>
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="flex">
                    <ol className="flex items-center space-x-1 text-sm text-muted-foreground">
                        {breadcrumbs.map((crumb, index) => (
                            <li key={`${crumb.label}-${index}`} className="flex items-center">
                                {index > 0 && (
                                    <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
                                )}
                                {crumb.href ? (
                                    <Link
                                        to={crumb.href}
                                        className="hover:text-foreground transition-colors focus:outline-none focus:text-foreground text-sm"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span
                                        aria-current="page"
                                        className="text-foreground font-semibold text-sm"
                                    >
                                        {crumb.label}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}

            {/* Header */}
            <div className="relative overflow-hidden rounded-xl border border-border bg-background/60">
                <div className="absolute inset-0 opacity-60" style={{
                    backgroundImage: 'radial-gradient(1200px 400px at 10% -10%, rgba(59,130,246,0.15), transparent), radial-gradient(900px 300px at 90% -20%, rgba(147,51,234,0.15), transparent)'
                }} />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between p-4 md:p-6">
                    <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 border border-primary/20 shadow-[0_0_24px_rgba(59,130,246,0.25)]">
                                {/* Glowing icon wrapper; fallback sparkles if none provided */}
                                {titleIcon ?? <svg width="16" height="16" viewBox="0 0 24 24" className="text-primary"><circle cx="12" cy="12" r="3" fill="currentColor" /><g stroke="currentColor" strokeWidth="1.5"><path d="M12 2v3" /><path d="M12 19v3" /><path d="M2 12h3" /><path d="M19 12h3" /><path d="M4.2 4.2l2.1 2.1" /><path d="M17.7 17.7l2.1 2.1" /><path d="M4.2 19.8l2.1-2.1" /><path d="M17.7 6.3l2.1-2.1" /></g></svg>}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className={cn(
                                    "font-bold tracking-tight bg-clip-text text-transparent",
                                    "bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300 drop-shadow-sm",
                                    compact ? "text-2xl" : "text-3xl"
                                )}>
                                    {title}
                                </h1>
                                {subtitle && (
                                    <p className="mt-1 text-base text-transparent bg-clip-text bg-gradient-to-r from-sky-200/90 to-fuchsia-200/90">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {actions && (
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap" aria-label="Page actions">
                            {actions}
                        </div>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            {toolbar && (
                <div className="border-b border-border pb-4">
                    <div
                        role="toolbar"
                        aria-label="Page tools"
                        className="flex flex-wrap items-center gap-2"
                    >
                        {toolbar}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main id="main-content" className="space-y-6">
                {children}
            </main>
        </div>
    )
}


