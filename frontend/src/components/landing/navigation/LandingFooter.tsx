import React from 'react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="mt-auto w-full border-t">
      <div className="container mx-auto px-4 py-6 text-sm text-muted-foreground flex items-center justify-between">
        <span>© {new Date().getFullYear()} SpamGPT. All rights reserved.</span>
        <nav className="flex items-center gap-4">
          <a href="/contact" className="hover:text-foreground">Contact</a>
          <a href="/pricing" className="hover:text-foreground">Pricing</a>
        </nav>
      </div>
    </footer>
  );
};