import React, { useEffect } from 'react';
import { useDemoStore } from '@/store/demo';
import { Badge } from '@/components/ui/badge';

interface DemoGuardProps {
  children: React.ReactNode;
  featureKey: string;
}

const DemoGuard: React.FC<DemoGuardProps> = ({ children, featureKey }) => {
  const { isDemoMode, setDemoMode, addDemoFeature } = useDemoStore();

  useEffect(() => {
    if (!isDemoMode) setDemoMode(true);
    addDemoFeature(featureKey);
    try {
      localStorage.setItem('demo_mode', '1');
      // @ts-expect-error add global flag for non-React modules
      window.DEMO_MODE = true;
    } catch (_) {}

    return () => {
      // Keep demo flag sticky across demos; do not remove on unmount
    };
  }, [isDemoMode, setDemoMode, addDemoFeature, featureKey]);

  return (
    <div className="relative">
      {/* Subtle banner */}
      <div className="sticky top-0 z-20 w-full flex items-center justify-center py-2">
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Interactive demo • Some actions are read-only</Badge>
      </div>
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default DemoGuard;