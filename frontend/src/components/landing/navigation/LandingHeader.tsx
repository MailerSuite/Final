import React from 'react';

export const LandingHeader: React.FC = () => {
  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="font-bold">SGPT</div>
        <nav className="text-sm text-muted-foreground">
          <a href="/final4/login" className="hover:text-foreground">Login</a>
        </nav>
      </div>
    </header>
  );
};