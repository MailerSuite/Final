import React from 'react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="mt-auto w-full border-t">
      <div className="container mx-auto px-4 py-6 text-sm text-muted-foreground">
        © {new Date().getFullYear()} SGPT. All rights reserved.
      </div>
    </footer>
  );
};