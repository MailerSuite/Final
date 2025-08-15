import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SmoothCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  variant?: 'default' | 'glass' | 'neon' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
}

const SmoothCard: React.FC<SmoothCardProps> = ({
  children,
  className,
  hover = true,
  glow = false,
  variant = 'default',
  size = 'md',
  interactive = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const variantClasses = {
    default: 'bg-background/80 border-border/30',
    glass: 'bg-white/5 backdrop-blur-2xl border-white/10',
    neon: 'bg-background/80 border-cyan-500/30',
    gradient: 'bg-gradient-to-br from-slate-800/80 to-slate-900/90 border-border/30'
  };

  return (
    <motion.div
      className={cn(
        "relative rounded-xl border backdrop-blur-xl overflow-hidden",
        "transition-all duration-500 ease-out cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? {
        y: -2,
        transition: { duration: 0.3, ease: "easeOut" }
      } : undefined}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered && glow
          ? "0 20px 40px -12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(34, 211, 238, 0.25)"
          : "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
      }}
    >
      {/* Animated Border */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: variant === 'neon'
            ? `linear-gradient(45deg, 
                ${isHovered ? 'rgba(34, 211, 238, 0.3)' : 'rgba(34, 211, 238, 0.12)'}, 
                ${isHovered ? 'rgba(96, 165, 250, 0.3)' : 'rgba(96, 165, 250, 0.12)'}, 
                ${isHovered ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.12)'})`
            : undefined,
          padding: '1px',
        }}
        animate={{
          background: variant === 'neon' && interactive ? [
            'linear-gradient(45deg, rgba(34, 211, 238, 0.12), rgba(96, 165, 250, 0.12), rgba(59, 130, 246, 0.12))',
            'linear-gradient(90deg, rgba(96, 165, 250, 0.2), rgba(59, 130, 246, 0.2), rgba(34, 211, 238, 0.2))',
            'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(34, 211, 238, 0.12), rgba(96, 165, 250, 0.12))'
          ] : undefined
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <div className={cn("rounded-xl h-full", variantClasses[variant])} />
      </motion.div>

      {/* Subtle Inner Glow */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-600/10 pointer-events-none opacity-0"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Floating Particles Effect */}
      {interactive && isHovered && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/60 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`
              }}
              animate={{
                y: [-10, -20, -10],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
};

export default SmoothCard;