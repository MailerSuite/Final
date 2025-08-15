import React from 'react'
import { motion } from 'framer-motion'
import { Mail, Sparkles, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedLogoProps {
  collapsed?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ 
  collapsed = false, 
  size = 'md',
  className,
  showText = true 
}) => {
  const sizes = {
    sm: { icon: 24, text: 'text-lg', container: 'w-8 h-8' },
    md: { icon: 32, text: 'text-xl', container: 'w-10 h-10' },
    lg: { icon: 40, text: 'text-2xl', container: 'w-12 h-12' }
  }

  const currentSize = sizes[size]

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Animated Logo Icon */}
      <motion.div
        className="relative"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.6 
        }}
      >
        {/* Glow effect container */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-lg blur-md",
            currentSize.container
          )}
          animate={{
            background: [
              'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)',
              'radial-gradient(circle, hsl(var(--primary) / 0.6) 0%, transparent 70%)',
              'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Main logo container */}
        <motion.div
          className={cn(
            "relative flex items-center justify-center rounded-lg",
            "bg-gradient-to-br from-primary via-primary/90 to-secondary",
            "shadow-lg shadow-primary/25",
            currentSize.container
          )}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 0 30px hsl(var(--primary) / 0.5)"
          }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Animated sparkles */}
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-3 h-3 text-yellow-400" />
          </motion.div>

          <motion.div
            className="absolute -bottom-1 -left-1"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 1,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
          </motion.div>

          {/* Main icon with pulse animation */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Mail className="text-white" size={currentSize.icon * 0.6} />
          </motion.div>

          {/* Lightning bolt accent */}
          <motion.div
            className="absolute top-0 right-0"
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Animated Text */}
      {showText && !collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col"
        >
          <motion.div className="flex items-baseline gap-1">
            <motion.span 
              className={cn(
                "font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent",
                currentSize.text
              )}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              Spam
            </motion.span>
            <motion.span 
              className={cn(
                "font-bold text-foreground",
                currentSize.text
              )}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: 0.5,
                type: "spring",
                stiffness: 500,
                damping: 15
              }}
            >
              GPT
            </motion.span>
          </motion.div>
          
          {/* Tagline */}
          {size !== 'sm' && (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-xs text-muted-foreground"
            >
              AI Email Marketing
            </motion.span>
          )}
        </motion.div>
      )}

      {/* Collapsed state - just show icon */}
      {collapsed && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Rotating border effect for collapsed state */}
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              background: 'conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent)',
            }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>
      )}
    </div>
  )
}

export default AnimatedLogo