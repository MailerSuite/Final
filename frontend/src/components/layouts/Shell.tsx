import React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

type BreadcrumbItem = { label: string; href?: string }

type ShellProps = {
    title?: string
    subtitle?: string
    actions?: React.ReactNode
    toolbar?: React.ReactNode
    breadcrumbs?: BreadcrumbItem[]
    className?: string
    children: React.ReactNode
    compact?: boolean
}

export default function Shell({
    title,
    subtitle,
    actions,
    toolbar,
    breadcrumbs = [],
    className,
    children,
    compact = false
}: ShellProps) {
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
                                        className="hover:text-foreground transition-colors focus:outline-none focus:text-foreground"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span 
                                        aria-current="page" 
                                        className="text-foreground font-medium"
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
            {(title || subtitle || actions) && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                        {title && (
                            <h1 className={cn(
                                "font-bold tracking-tight text-foreground",
                                compact ? "text-2xl" : "text-3xl"
                            )}>
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className="text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    {actions && (
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap" aria-label="Page actions">
                            {actions}
                        </div>
                    )}
                </div>
            )}

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

