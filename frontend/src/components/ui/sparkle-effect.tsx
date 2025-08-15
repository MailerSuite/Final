import React from 'react'
import { cn } from '@/lib/utils'

interface SparkleEffectProps {
    className?: string
    intensity?: 'subtle' | 'normal' | 'strong'
}

const intensityToOpacity: Record<NonNullable<SparkleEffectProps['intensity']>, string> = {
    subtle: 'opacity-20',
    normal: 'opacity-30',
    strong: 'opacity-40',
}

export const SparkleEffect: React.FC<SparkleEffectProps> = ({ className, intensity = 'subtle' }) => {
    return (
        <div
            aria-hidden
            className={cn(
                'pointer-events-none absolute inset-0 blur-3xl',
                intensityToOpacity[intensity],
                className
            )}
        >
            <div
                className={cn('absolute -top-1/2 -left-1/2 h-[200%] w-[200%] animate-[spin_25s_linear_infinite]')}
                style={{
                    background:
                        'conic-gradient(from 180deg at 50% 50%, rgba(56,189,248,0.28), rgba(99,102,241,0.22), rgba(217,70,239,0.18), rgba(56,189,248,0.28))',
                    maskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.6) 20%, rgba(0,0,0,0.2) 50%, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.6) 20%, rgba(0,0,0,0.2) 50%, transparent 70%)',
                }}
            />
        </div>
    )
}

interface GlowingIconProps {
    children: React.ReactNode
    color?: 'blue' | 'purple' | 'green' | 'orange'
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const colorClasses = {
    blue: 'text-blue-500 shadow-blue-500/50',
    purple: 'text-purple-500 shadow-purple-500/50',
    green: 'text-green-500 shadow-green-500/50',
    orange: 'text-orange-500 shadow-orange-500/50',
}

const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
}

export const GlowingIcon: React.FC<GlowingIconProps> = ({
    children,
    color = 'blue',
    size = 'md',
    className
}) => {
    return (
        <div
            className={cn(
                'relative',
                sizeClasses[size],
                className
            )}
        >
            <div className={cn(
                'absolute inset-0 rounded-full blur-sm',
                colorClasses[color],
                'animate-pulse'
            )} />
            <div className={cn(
                'relative z-10',
                sizeClasses[size],
                colorClasses[color]
            )}>
                {children}
            </div>
        </div>
    )
}

export default SparkleEffect