import React from 'react';
import { Logo } from '@/components/branding';

export const LandingHeader: React.FC = () => {
  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/landing/spamgpt" className="flex items-center gap-2">
          <Logo variant="compact" size="md" animated={false} />
        </a>
        <nav className="text-sm text-muted-foreground flex items-center gap-4">
          <a href="mailto:support@mailersuite.io" className="hover:text-foreground hidden md:inline-block">Contact</a>
          <a href="/pricing" className="hover:text-foreground hidden sm:inline-block">Pricing</a>
          <a href="/sign-up" className="hover:text-foreground hidden sm:inline-block">Sign up</a>
          <a href="/login" className="hover:text-foreground">Login</a>
        </nav>
      </div>
    </header>
  );
};