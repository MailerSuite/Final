import React from 'react';
import { LandingHeader, LandingFooter } from '@/components/landing';
import { BackgroundEffects } from '@/components/ui/BackgroundEffects';
import DeliverabilityDashboard from '@/pages/deliverability/DeliverabilityDashboard';

const DeliverabilityDemoPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <BackgroundEffects className="opacity-70" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <LandingHeader />
        <main className="flex-1">
          <DeliverabilityDashboard />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
};

export default DeliverabilityDemoPage;