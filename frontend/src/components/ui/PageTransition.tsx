import React from 'react'
import { motion } from 'framer-motion'
import { PageTransition as PageTransitionComponent } from './animations'

interface PageTransitionProps {
    children: React.ReactNode
    className?: string
    delay?: number
}

export const PageTransition: React.FC<PageTransitionProps> = ({
    children,
    className = '',
    delay = 0
}) => {
    return (
        <PageTransitionComponent className={className}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                    duration: 0.3,
                    delay,
                    ease: [0.25, 0.46, 0.45, 0.94]
                }}
            >
                {children}
            </motion.div>
        </PageTransitionComponent>
    )
}

// Staggered page content for multiple sections
interface StaggeredPageContentProps {
    children: React.ReactNode
    className?: string
    staggerDelay?: number
}

export const StaggeredPageContent: React.FC<StaggeredPageContentProps> = ({
    children,
    className = '',
    staggerDelay = 0.1
}) => {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
                duration: 0.3,
                staggerChildren: staggerDelay,
                delayChildren: 0.1
            }}
        >
            {children}
        </motion.div>
    )
}

// Individual page section with animation
interface PageSectionProps {
    children: React.ReactNode
    className?: string
    delay?: number
}

export const PageSection: React.FC<PageSectionProps> = ({
    children,
    className = '',
    delay = 0
}) => {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.25,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94]
            }}
        >
            {children}
        </motion.div>
    )
}
