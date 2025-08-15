import React from 'react';
import { LandingHeader, LandingFooter } from '@/components/landing';
import { BackgroundEffects } from '@/components/ui/BackgroundEffects';
import DemoSandbox from '@/components/demo/DemoSandbox';
import BlacklistCheckerEnhanced from '@/pages/finalui2/pages/BlacklistCheckerEnhanced';

const BlacklistDemoPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <BackgroundEffects className="opacity-70" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <LandingHeader />
        <main className="flex-1">
          <DemoSandbox note="Demo: blacklist checks use mocked responses">
            <BlacklistCheckerEnhanced />
          </DemoSandbox>
        </main>
        <LandingFooter />
      </div>
    </div>
  );
};

export default BlacklistDemoPage;