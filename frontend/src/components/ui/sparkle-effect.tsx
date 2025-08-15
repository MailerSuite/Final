import React, { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: 'blue' | 'purple';
  delay: number;
}

interface SparkleEffectProps {
  className?: string;
  count?: number;
  colors?: ('blue' | 'purple')[];
  minSize?: number;
  maxSize?: number;
  animationDuration?: number;
}

export const SparkleEffect: React.FC<SparkleEffectProps> = ({
  className,
  count = 20,
  colors = ['blue', 'purple'],
  minSize = 2,
  maxSize = 6,
  animationDuration = 3000,
}) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const generateSparkles = () => {
      const newSparkles: Sparkle[] = [];
      for (let i = 0; i < count; i++) {
        newSparkles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * (maxSize - minSize) + minSize,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * animationDuration,
        });
      }
      setSparkles(newSparkles);
    };

    generateSparkles();
    const interval = setInterval(generateSparkles, animationDuration);

    return () => clearInterval(interval);
  }, [count, colors, minSize, maxSize, animationDuration]);

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute animate-sparkle"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            backgroundColor: sparkle.color === 'blue' ? '#3AAFFF' : '#7B2FF7',
            borderRadius: '50%',
            boxShadow: `0 0 ${sparkle.size * 2}px ${
              sparkle.color === 'blue' ? 'rgba(58, 175, 255, 0.8)' : 'rgba(123, 47, 247, 0.8)'
            }`,
            animationDelay: `${sparkle.delay}ms`,
          }}
        />
      ))}
    </div>
  );
};

interface MagicalBackgroundProps {
  className?: string;
  showSparkles?: boolean;
  showGradient?: boolean;
  showSwirl?: boolean;
}

export const MagicalBackground: React.FC<MagicalBackgroundProps> = ({
  className,
  showSparkles = true,
  showGradient = true,
  showSwirl = false,
}) => {
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      {showGradient && (
        <div className="absolute inset-0 bg-wizard-gradient-subtle opacity-30" />
      )}
      {showSwirl && (
        <div className="absolute inset-0 bg-wizard-swirl animate-swirl" />
      )}
      {showSparkles && <SparkleEffect />}
    </div>
  );
};

interface GlowingIconProps {
  children: React.ReactNode;
  className?: string;
  color?: 'blue' | 'purple';
  size?: 'sm' | 'md' | 'lg';
}

export const GlowingIcon: React.FC<GlowingIconProps> = ({
  children,
  className,
  color = 'blue',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const glowClasses = color === 'blue' ? 'wizard-glow' : 'wizard-glow-purple';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full',
        'bg-gradient-to-br from-wizard-primary-accent/10 to-wizard-secondary-accent/10',
        'wizard-hover-glow transition-all duration-300',
        sizeClasses[size],
        glowClasses,
        className
      )}
    >
      {children}
    </div>
  );
};

export default SparkleEffect;