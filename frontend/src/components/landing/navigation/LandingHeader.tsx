import React from 'react';
import { Logo } from '@/components/branding/Logo';

export const LandingHeader: React.FC = () => {
  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo variant="compact" size="md" animated={true} />
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="/pricing" className="hover:text-foreground">Pricing</a>
          <a href="/contact" className="hover:text-foreground">Contact</a>
          <a href="/auth/login" className="hover:text-foreground">Login</a>
        </nav>
        <nav className="md:hidden text-sm text-muted-foreground">
          <a href="/auth/login" className="hover:text-foreground">Login</a>
        </nav>
      </div>
    </header>
  );
};