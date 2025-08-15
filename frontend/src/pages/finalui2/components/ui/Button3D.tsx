import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Button3DProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const Button3D: React.FC<Button3DProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  icon: Icon
}) => {
  const variants = {
    primary: 'bg-gradient-to-b from-cyan-400 to-cyan-600 text-white shadow-cyan-500/30',
    secondary: 'bg-gradient-to-b from-slate-600 to-slate-800 text-white shadow-slate-500/30',
    ghost: 'bg-gradient-to-b from-white/10 to-white/5 text-white border border-white/20 shadow-white/10',
    danger: 'bg-gradient-to-b from-red-400 to-red-600 text-white shadow-red-500/30'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      className={cn(
        "relative rounded-xl font-medium transition-all duration-200",
        "shadow-lg active:shadow-sm",
        "transform-gpu perspective-1000",
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { 
        scale: 1.02,
        y: -1,
        rotateX: 5,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      } : undefined}
      whileTap={!disabled ? { 
        scale: 0.98,
        y: 0,
        rotateX: 0,
        transition: { duration: 0.1 }
      } : undefined}
      style={{
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Top Highlight */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none" />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </span>

      {/* Bottom Shadow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </motion.button>
  );
};

export default Button3D;