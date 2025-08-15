import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { hoverScale, hoverLift, hoverGlow } from './animations'

interface AnimatedCardProps {
    children: React.ReactNode
    className?: string
    delay?: number
    hoverEffect?: 'scale' | 'lift' | 'glow' | 'none'
    onClick?: () => void
    clickable?: boolean
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    children,
    className = '',
    delay = 0,
    hoverEffect = 'scale',
    onClick,
    clickable = false
}) => {
    const hoverAnimation = hoverEffect === 'scale' ? hoverScale :
        hoverEffect === 'lift' ? hoverLift :
            hoverEffect === 'glow' ? hoverGlow : {}

    return (
        <motion.div
            className={cn(
                'bg-card border border-border rounded-lg shadow-sm',
                clickable && 'cursor-pointer',
                className
            )}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.25,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94]
            }}
            whileHover={hoverEffect !== 'none' ? hoverAnimation : {}}
            whileTap={clickable ? { scale: 0.98 } : {}}
            onClick={onClick}
        >
            {children}
        </motion.div>
    )
}

// Card with header
interface AnimatedCardWithHeaderProps extends AnimatedCardProps {
    title?: React.ReactNode
    subtitle?: React.ReactNode
    icon?: React.ReactNode
    actions?: React.ReactNode
}

export const AnimatedCardWithHeader: React.FC<AnimatedCardWithHeaderProps> = ({
    children,
    title,
    subtitle,
    icon,
    actions,
    ...cardProps
}) => {
    return (
        <AnimatedCard {...cardProps}>
            {(title || icon || actions) && (
                <motion.div
                    className="flex items-center justify-between p-4 border-b border-border"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (cardProps.delay || 0) + 0.1, duration: 0.2 }}
                >
                    <div className="flex items-center gap-3">
                        {icon && (
                            <motion.div
                                className="p-2 rounded-lg bg-primary/10 text-primary"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ duration: 0.2 }}
                            >
                                {icon}
                            </motion.div>
                        )}
                        <div>
                            {title && (
                                <h3 className="font-semibold text-foreground">{title}</h3>
                            )}
                            {subtitle && (
                                <p className="text-sm text-muted-foreground">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    {actions && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (cardProps.delay || 0) + 0.2, duration: 0.2 }}
                        >
                            {actions}
                        </motion.div>
                    )}
                </motion.div>
            )}
            <motion.div
                className="p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (cardProps.delay || 0) + 0.15, duration: 0.2 }}
            >
                {children}
            </motion.div>
        </AnimatedCard>
    )
}

// Grid of animated cards
interface AnimatedCardGridProps {
    children: React.ReactNode
    className?: string
    columns?: number
    gap?: number
}

export const AnimatedCardGrid: React.FC<AnimatedCardGridProps> = ({
    children,
    className = '',
    columns = 3,
    gap = 4
}) => {
    return (
        <motion.div
            className={cn(
                'grid gap-4',
                className
            )}
            style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: `${gap * 0.25}rem`
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
                duration: 0.3,
                staggerChildren: 0.1,
                delayChildren: 0.1
            }}
        >
            {children}
        </motion.div>
    )
}
