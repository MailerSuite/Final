import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ThreeDWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    enable3D?: boolean
    intensity?: number
    shadow?: boolean
}

/**
 * ThreeDWrapper
 * Lightweight hover tilt wrapper with spring smoothing.
 * - Optional via enable3D flag
 * - Designed for cards, panels, and interactive blocks
 */
export const ThreeDWrapper: React.FC<ThreeDWrapperProps> = ({
    enable3D = true,
    intensity = 12,
    shadow = true,
    className,
    children,
    ...rest
}) => {
    const ref = useRef<HTMLDivElement | null>(null)
    const rafRef = useRef<number>(0)
    const targetRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 })
    const currentRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 })
    const [rotation, setRotation] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 })

    const tick = () => {
        const lerp = 0.12
        currentRef.current.x += (targetRef.current.x - currentRef.current.x) * lerp
        currentRef.current.y += (targetRef.current.y - currentRef.current.y) * lerp
        const rx = (0.5 - currentRef.current.y) * 2 * intensity
        const ry = (currentRef.current.x - 0.5) * 2 * intensity
        setRotation({ rx, ry })
        if (Math.abs(targetRef.current.x - currentRef.current.x) + Math.abs(targetRef.current.y - currentRef.current.y) > 0.001) {
            rafRef.current = requestAnimationFrame(tick)
        } else {
            rafRef.current = 0
        }
    }

    const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!enable3D || !ref.current) return
        const rect = ref.current.getBoundingClientRect()
        targetRef.current.x = (e.clientX - rect.left) / rect.width
        targetRef.current.y = (e.clientY - rect.top) / rect.height
        if (!rafRef.current) rafRef.current = requestAnimationFrame(tick)
    }

    const handleLeave = () => {
        targetRef.current = { x: 0.5, y: 0.5 }
        if (!rafRef.current) rafRef.current = requestAnimationFrame(tick)
    }

    useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

    if (!enable3D) {
        return (
            <div className={cn('will-change-auto', className)} {...rest}>
                {children}
            </div>
        )
    }

    return (
        <motion.div
            ref={ref}
            onPointerMove={handleMove}
            onPointerLeave={handleLeave}
            style={{
                perspective: 1000,
            }}
            className={cn('relative will-change-transform', className)}
            {...rest}
            aria-label={rest['aria-label'] || '3D interactive container'}
            role={rest.role || 'group'}
        >
            <motion.div
                style={{
                    rotateX: rotation.rx,
                    rotateY: rotation.ry,
                }}
                className={cn(
                    'transition-transform duration-150 ease-out',
                    shadow && 'shadow-[0_10px_30px_-10px_rgba(0,196,255,0.35)]'
                )}
            >
                {children}
            </motion.div>
        </motion.div>
    )
}

export default ThreeDWrapper

