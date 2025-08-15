/**
 * Tech/AI Enhanced 3D Loading Spinner - SpamGPT Platform
 * Professional animated spinner with sophisticated 3D effects and tech aesthetics
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CpuChipIcon, BoltIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface TechLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'cyan' | 'blue' | 'white';
  showText?: boolean;
  text?: string;
  className?: string;
}

const TechLoadingSpinner: React.FC<TechLoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  showText = false,
  text = 'Loading...',
  className = ''
}) => {
  const sizeClasses = {
    sm: { spinner: 'w-8 h-8', inner: 'w-6 h-6', icon: 'w-3 h-3', text: 'text-sm' },
    md: { spinner: 'w-12 h-12', inner: 'w-9 h-9', icon: 'w-4 h-4', text: 'text-base' },
    lg: { spinner: 'w-16 h-16', inner: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-lg' },
    xl: { spinner: 'w-24 h-24', inner: 'w-18 h-18', icon: 'w-8 h-8', text: 'text-xl' }
  };

  const colors = {
    primary: {
      outer: 'border-primary/30',
      inner: 'border-primary/60',
      glow: 'shadow-primary/30',
      icon: 'text-primary',
      particles: 'bg-primary/40'
    },
    cyan: {
      outer: 'border-primary/30',
      inner: 'border-primary/60',
      glow: 'shadow-primary/30',
      icon: 'text-primary',
      particles: 'bg-primary/40'
    },
    blue: {
      outer: 'border-primary/30',
      inner: 'border-primary/60',
      glow: 'shadow-primary/30',
      icon: 'text-primary',
      particles: 'bg-primary/40'
    },
    white: {
      outer: 'border-white/30',
      inner: 'border-white/60',
      glow: 'shadow-white/30',
      icon: 'text-white',
      particles: 'bg-white/40'
    }
  };

  const s = sizeClasses[size];
  const c = colors[variant];

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Main 3D Spinner Container */}
      <div className="relative" style={{ perspective: '200px' }}>
        {/* Outer Rotating Ring */}
        <motion.div
          className={`${s.spinner} relative border-2 ${c.outer} rounded-full bg-gradient-to-br from-background/20 to-background/5 backdrop-blur-sm shadow-2xl ${c.glow}`}
          animate={{
            rotateY: 360,
            rotateZ: 360
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Inner Rotating Ring */}
          <motion.div
            className={`absolute inset-2 ${s.inner} border-2 ${c.inner} rounded-full bg-gradient-to-tr from-background/30 to-background/10 backdrop-blur-md`}
            animate={{
              rotateX: -360,
              rotateY: -360
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* Center Icon */}
            <motion.div
              className={`absolute inset-0 flex items-center justify-center ${c.icon}`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <CpuChipIcon className={s.icon} />
            </motion.div>
          </motion.div>

          {/* Tech Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 ${c.particles} rounded-full`}
              style={{
                left: '50%',
                top: '50%',
                transformOrigin: `${20 + i * 8}px 0px`,
              }}
              animate={{
                rotate: 360,
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))}

          {/* Scanning Line */}
          <motion.div
            className={`absolute inset-0 border-2 border-transparent rounded-full`}
            style={{
              borderTopColor: 'hsl(var(--primary))',
              borderTopWidth: '3px',
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>

        {/* Floating Tech Icons */}
        <motion.div
          className={`absolute -top-2 -right-2 ${c.icon}`}
          animate={{
            y: [0, -4, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <BoltIcon className="w-3 h-3" />
        </motion.div>

        <motion.div
          className={`absolute -bottom-2 -left-2 ${c.icon}`}
          animate={{
            y: [0, 4, 0],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
        >
          <SparklesIcon className="w-3 h-3" />
        </motion.div>

        {/* Pulsing Glow Effect */}
        <motion.div
          className={`absolute inset-0 ${s.spinner} rounded-full bg-primary/10 blur-sm`}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Loading Text with Tech Effect */}
      {showText && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.p
            className={`${s.text} font-medium ${c.icon} tracking-wider`}
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {text}
          </motion.p>

          {/* Animated Dots */}
          <motion.div className="flex justify-center space-x-1 mt-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className={`w-1 h-1 ${c.particles} rounded-full`}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default TechLoadingSpinner;