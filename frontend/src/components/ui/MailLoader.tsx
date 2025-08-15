import React from 'react'
import { motion } from 'framer-motion'
import { EnvelopeIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

export interface MailLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  label?: string
  className?: string
  icon?: 'envelope' | 'paper'
  variant?: 'glow' | 'ring'
}

const sizeMap = {
  sm: { box: 'w-8 h-8 p-1.5', icon: 'w-4 h-4', radius: 10 },
  md: { box: 'w-12 h-12 p-2.5', icon: 'w-6 h-6', radius: 14 },
  lg: { box: 'w-16 h-16 p-3', icon: 'w-8 h-8', radius: 18 },
  xl: { box: 'w-20 h-20 p-4', icon: 'w-10 h-10', radius: 22 },
} as const

/**
 * Minimal mailing-themed loader: a subtle glowing envelope/paper-plane.
 * Designed to replace plain "Loading..." text in Suspense fallbacks and small inline spots.
 */
export default function MailLoader({
  size = 'md',
  label = 'Loading',
  className = '',
  icon = 'envelope',
  variant = 'glow',
}: MailLoaderProps) {
  const s = sizeMap[size]
  const Icon = icon === 'paper' ? PaperAirplaneIcon : EnvelopeIcon

  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-live="polite">
      <motion.div
        className={`relative inline-flex items-center justify-center rounded-lg border ${s.box} bg-primary/5 border-primary/25 shadow-inner`}
        animate={
          variant === 'glow'
            ? { boxShadow: ['0 0 0px rgba(0,0,0,0)', '0 0 18px rgba(59,130,246,0.25)', '0 0 0px rgba(0,0,0,0)'] }
            : undefined
        }
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Icon */}
        <motion.div
          animate={
            variant === 'glow'
              ? { y: [0, -2, 0], rotate: icon === 'paper' ? [0, -8, 0, 8, 0] : [0, 0, 0] }
              : { scale: [1, 1.05, 1] }
          }
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon className={`${s.icon} text-primary`} />
        </motion.div>

        {/* Orbits / Ring */}
        {variant === 'glow' ? (
          [...Array(3)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/60"
              style={{ left: '50%', top: '50%' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.6 + i * 0.2, repeat: Infinity, ease: 'linear' }}
            >
              <span
                className="block w-1 h-1 rounded-full bg-primary/60"
                style={{ transform: `translate(${s.radius}px, -0.5px)` }}
              />
            </motion.span>
          ))
        ) : (
          <>
            {/* Rotating ring accent */}
            <motion.span
              className="absolute inset-0 rounded-lg border-2 border-transparent"
              style={{ borderTopColor: 'hsl(var(--primary))' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            />
            {/* Dots around a circle */}
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * 2 * Math.PI
              const x = Math.cos(angle) * s.radius
              const y = Math.sin(angle) * s.radius
              return (
                <motion.span
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-primary/60"
                  style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.6, delay: i * 0.08, repeat: Infinity, ease: 'easeInOut' }}
                />
              )
            })}
          </>
        )}
      </motion.div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
