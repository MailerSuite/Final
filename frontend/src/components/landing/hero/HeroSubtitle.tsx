import React from 'react';
import { cn } from '@/lib/utils';

interface HeroSubtitleProps {
  children: React.ReactNode;
  className?: string;
}

export const HeroSubtitle: React.FC<HeroSubtitleProps> = ({ children, className }) => {
  return (
    <p className={cn('mt-4 text-base md:text-lg text-muted-foreground', className)}>
      {children}
    </p>
  );
};