import React from 'react';
import { AnimatedLogo } from '@/components/ui/animated-logo';

export const LandingHeader: React.FC = () => {
  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/landing/spamgpt" className="flex items-center gap-2">
          <AnimatedLogo size="sm" />
        </a>
        <nav className="text-sm text-muted-foreground">
          <a href="/auth/login" className="hover:text-foreground">Login</a>
        </nav>
      </div>
    </header>
  );
};