import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
    title?: string
    className?: string
    children: React.ReactNode
}

const PageWrapper: React.FC<PageWrapperProps> = ({
    title = 'SGPT',
    className,
    children,
}) => {
    // Update document title when provided
    useEffect(() => {
        if (title) {
            document.title = `${title} | SGPT`
        }
    }, [title])

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div
                className={cn(
                    'w-full mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-screen-2xl',
                    className,
                )}
            >
                {children}
            </div>
        </div>
    )
}

export default PageWrapper

