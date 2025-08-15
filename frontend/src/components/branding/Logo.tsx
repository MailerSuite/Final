/**
 * Professional Animated Logo Component for MailerSuite
 * Uses unified design system colors and cyberpunk effects
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'icon' | 'text' | 'compact' | 'hero';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

// Enhanced animation variants using design system colors
const logoVariants = {
  initial: { 
    scale: 0.8, 
    opacity: 0,
    rotate: -5
  },
  animate: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.05,
    rotate: 2,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

const iconVariants = {
  initial: { 
    scale: 0.5, 
    opacity: 0,
    rotate: -180
  },
  animate: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

const textVariants = {
  initial: { 
    x: -20, 
    opacity: 0 
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      delay: 0.3,
      ease: "easeOut"
    }
  },
  hover: {
    x: 2,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

// Cyberpunk glow effects using design system variables
const glowVariants = {
  animate: {
    opacity: [0.3, 0.6, 0.3],
    scale: [1, 1.1, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Orbiting particles animation
const particleVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  animated = true,
  className,
  onClick
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16'
  };

  const LogoIcon = () => (
    <motion.div
      variants={animated ? iconVariants : undefined}
      className="relative"
    >
      {/* Multi-layered glow effects using design system colors */}
      {animated && (
        <>
          {/* Primary glow ring */}
          <motion.div
            variants={glowVariants}
            animate="animate"
            className="absolute inset-0 rounded-xl opacity-40"
            style={{
              boxShadow: '0 0 30px hsl(var(--primary) / 0.4)'
            }}
          />
          
          {/* Secondary glow ring */}
          <motion.div
            variants={glowVariants}
            animate="animate"
            className="absolute inset-0 rounded-xl opacity-30"
            style={{
              boxShadow: '0 0 20px hsl(var(--secondary) / 0.3)'
            }}
          />
          
          {/* Accent glow ring */}
          <motion.div
            variants={glowVariants}
            animate="animate"
            className="absolute inset-0 rounded-xl opacity-25"
            style={{
              boxShadow: '0 0 25px hsl(var(--accent) / 0.3)'
            }}
          />
        </>
      )}
      
      {/* Main icon container with design system gradients */}
      <div className="relative bg-gradient-to-br from-primary via-primary-600 to-accent rounded-xl p-2 shadow-lg border border-primary/20">
        <Mail className={cn("text-white", iconSizes[size])} />
        
        {/* Inner highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-xl" />
      </div>
      
      {/* Animated accent elements */}
      {animated && (
        <>
          {/* Top-right sparkle */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-1 -right-1 bg-gradient-to-r from-secondary to-secondary-400 rounded-full p-1"
            style={{
              boxShadow: '0 0 10px hsl(var(--secondary) / 0.6)'
            }}
          >
            <Sparkles className="w-3 h-3 text-white" />
          </motion.div>
          
          {/* Bottom-left shield */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="absolute -bottom-1 -left-1 bg-gradient-to-r from-accent to-accent-400 rounded-full p-1"
            style={{
              boxShadow: '0 0 10px hsl(var(--accent) / 0.6)'
            }}
          >
            <Shield className="w-3 h-3 text-white" />
          </motion.div>
        </>
      )}
      
      {/* Orbiting particles */}
      {animated && (
        <motion.div
          variants={particleVariants}
          animate="animate"
          className="absolute inset-0"
        >
          {/* Primary particle */}
          <div className="absolute -top-2 left-1/2 w-1 h-1 bg-primary rounded-full" 
               style={{ boxShadow: '0 0 6px hsl(var(--primary))' }} />
          
          {/* Secondary particle */}
          <div className="absolute top-1/2 -right-2 w-1 h-1 bg-secondary rounded-full"
               style={{ boxShadow: '0 0 6px hsl(var(--secondary))' }} />
          
          {/* Accent particle */}
          <div className="absolute -bottom-2 left-1/2 w-1 h-1 bg-accent rounded-full"
               style={{ boxShadow: '0 0 6px hsl(var(--accent))' }} />
        </motion.div>
      )}
    </motion.div>
  );

  const LogoText = () => (
    <motion.div
      variants={animated ? textVariants : undefined}
      className={cn("font-bold", sizeClasses[size])}
    >
      <span className="bg-gradient-to-r from-primary via-primary-400 to-secondary bg-clip-text text-transparent">
        Mailer
      </span>
      <span className="text-foreground">Suite</span>
      <span className="text-xs text-muted-foreground font-normal ml-1">2</span>
    </motion.div>
  );

  const CompactLogo = () => (
    <motion.div
      variants={animated ? logoVariants : undefined}
      className="flex items-center gap-2"
    >
      <div className="relative">
        <div className="bg-gradient-to-br from-primary to-accent rounded-md p-1.5">
          <Mail className="w-4 h-4 text-white" />
        </div>
        <div className="absolute -top-0.5 -right-0.5 bg-secondary rounded-full p-0.5">
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>
      </div>
      <span className="font-semibold text-sm text-foreground">MS2</span>
    </motion.div>
  );

  const HeroLogo = () => (
    <motion.div
      variants={animated ? logoVariants : undefined}
      className="flex flex-col items-center gap-6"
    >
      {/* Large animated icon */}
      <div className="relative">
        <LogoIcon />
        
        {/* Hero-specific effects */}
        {animated && (
          <>
            {/* Pulsing background rings */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-3xl"
            />
            
            {/* Floating elements */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-4 -right-4 w-3 h-3 bg-secondary rounded-full"
              style={{ boxShadow: '0 0 15px hsl(var(--secondary))' }}
            />
            
            <motion.div
              animate={{
                y: [0, 10, 0],
                rotate: [0, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute -bottom-4 -left-4 w-3 h-3 bg-accent rounded-full"
              style={{ boxShadow: '0 0 15px hsl(var(--accent))' }}
            />
          </>
        )}
      </div>
      
      {/* Hero text */}
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
        >
          MailerSuite
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-muted-foreground mt-2 text-lg"
        >
          Advanced Email Marketing Platform
        </motion.p>
      </div>
    </motion.div>
  );

  const renderLogo = () => {
    switch (variant) {
      case 'icon':
        return <LogoIcon />;
      
      case 'text':
        return <LogoText />;
      
      case 'compact':
        return <CompactLogo />;
      
      case 'hero':
        return <HeroLogo />;
      
      case 'full':
      default:
        return (
          <motion.div
            variants={animated ? logoVariants : undefined}
            className="flex items-center gap-3"
          >
            <LogoIcon />
            <LogoText />
          </motion.div>
        );
    }
  };

  return (
    <motion.div
      initial={animated ? "initial" : undefined}
      animate={animated ? "animate" : undefined}
      whileHover={animated ? "hover" : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center",
        onClick && "cursor-pointer",
        className
      )}
    >
      {renderLogo()}
    </motion.div>
  );
};

// Alternative Logo Variations using design system colors
export const LogoVariants = {
  // Minimalist version
  Minimal: ({ className }: { className?: string }) => (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded flex items-center justify-center">
        <Mail className="w-4 h-4 text-white" />
      </div>
      <span className="font-bold text-foreground">MS</span>
    </div>
  ),

  // Icon only with badge
  IconWithBadge: ({ className }: { className?: string }) => (
    <div className={cn("relative", className)}>
      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
        <Mail className="w-5 h-5 text-white" />
      </div>
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center">
        <span className="text-[10px] text-white font-bold">2</span>
      </div>
    </div>
  ),

  // Text only stylized
  TextOnly: ({ size = 'md', className }: { size?: LogoProps['size']; className?: string }) => {
    const textSizes = {
      sm: 'text-lg',
      md: 'text-xl', 
      lg: 'text-2xl',
      xl: 'text-3xl'
    };

    return (
      <div className={cn("font-bold", textSizes[size], className)}>
        <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          MailerSuite
        </span>
        <span className="text-xs text-secondary font-normal ml-1">2</span>
      </div>
    );
  }
};

// Branding Colors & Gradients using design system
export const BrandColors = {
  primary: 'from-primary to-primary-600',
  secondary: 'from-secondary to-secondary-600',
  accent: 'from-accent to-accent-600',
  primaryToAccent: 'from-primary via-secondary to-accent',
  cyberpunk: 'from-primary via-secondary to-accent'
};

// Enhanced Loading Logo Animation with Magical Effects
export const LoadingLogo: React.FC<{ className?: string }> = ({ className }) => (
  <motion.div
    className={cn("flex items-center gap-4", className)}
    animate={{
      scale: [1, 1.02, 1],
      opacity: [0.9, 1, 0.9]
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    style={{
      willChange: 'transform, opacity'
    }}
  >
    <div className="relative">
      {/* Enhanced multi-layered glow effects */}
      <motion.div
        animate={{
          opacity: [0.3, 0.7, 0.3],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 rounded-xl opacity-50"
        style={{
          boxShadow: '0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(139, 92, 246, 0.4)'
        }}
      />
      
      {/* Secondary magical glow ring */}
      <motion.div
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [0.9, 1.2, 0.9]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute inset-0 rounded-xl"
        style={{
          boxShadow: '0 0 60px rgba(96, 165, 250, 0.5), 0 0 120px rgba(168, 85, 247, 0.3)'
        }}
      />
      
      {/* Main logo container with enhanced gradient */}
      <motion.div 
        className="w-14 h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 rounded-xl flex items-center justify-center relative overflow-hidden shadow-2xl border border-blue-400/30"
        animate={{
          rotateY: [0, 5, 0, -5, 0],
          rotateX: [0, 2, 0, -2, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          willChange: 'transform',
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}
      >
        <Mail className="w-7 h-7 text-white relative z-10" />
        
        {/* Inner magical highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-blue-200/10 to-transparent rounded-xl" />
        
        {/* Rotating magical border */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-transparent border-t-blue-300 border-r-purple-400 rounded-xl"
          style={{ willChange: 'transform' }}
        />
        
        {/* Orbiting particles */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
          style={{ willChange: 'transform' }}
        >
          <div className="absolute -top-1 left-1/2 w-1 h-1 bg-blue-300 rounded-full shadow-sm" 
               style={{ boxShadow: '0 0 4px rgb(147, 197, 253)' }} />
          <div className="absolute top-1/2 -right-1 w-1 h-1 bg-purple-300 rounded-full shadow-sm" 
               style={{ boxShadow: '0 0 4px rgb(196, 181, 253)' }} />
          <div className="absolute -bottom-1 left-1/2 w-1 h-1 bg-indigo-300 rounded-full shadow-sm" 
               style={{ boxShadow: '0 0 4px rgb(165, 180, 252)' }} />
        </motion.div>
        
        {/* Magical sparkle effects */}
        <motion.div
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute -top-1 -right-1 w-2 h-2 bg-blue-200 rounded-full"
          style={{ boxShadow: '0 0 8px rgb(191, 219, 254)' }}
        />
      </motion.div>
    </div>
    
    <div className="space-y-1">
      {/* Enhanced SGPT text with magical glow */}
      <motion.div 
        className="font-bold text-2xl bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 bg-clip-text text-transparent relative"
        animate={{
          filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)']
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          willChange: 'filter',
          textShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
        }}
      >
        SGPT
        
        {/* Text glow effect */}
        <motion.div
          animate={{
            opacity: [0, 0.3, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 bg-clip-text text-transparent blur-sm"
          style={{ willChange: 'opacity' }}
        >
          SGPT
        </motion.div>
      </motion.div>
      
      {/* Enhanced loading text */}
      <motion.div 
        className="text-sm text-blue-300/80 font-medium"
        animate={{
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        style={{ willChange: 'opacity' }}
      >
        Loading...
      </motion.div>
    </div>
  </motion.div>
);

export default Logo; 