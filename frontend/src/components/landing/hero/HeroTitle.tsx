import React from 'react';
import { cn } from '@/lib/utils';

interface HeroTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const HeroTitle: React.FC<HeroTitleProps> = ({ children, className }) => {
  return (
    <h1
      className={cn(
        'text-4xl md:text-6xl font-extrabold tracking-tight text-foreground',
        className
      )}
    >
      {children}
    </h1>
  );
};