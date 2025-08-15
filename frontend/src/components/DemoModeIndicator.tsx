import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Camera, Power } from 'lucide-react';
import { useDemoStore } from '@/store/demo';

const DemoModeIndicator: React.FC = () => {
  const { isDemoMode, toggleDemoMode } = useDemoStore();

  if (!isDemoMode) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <Badge 
        variant="default" 
        className="bg-orange-500 hover:bg-orange-600 text-white border-orange-600 shadow-lg animate-pulse"
      >
        <Camera className="w-3 h-3 mr-1" />
        Demo Mode
      </Badge>
      <button
        onClick={toggleDemoMode}
        className="p-1 rounded-md bg-card hover:bg-muted text-muted-foreground hover:text-white transition-colors"
        title="Toggle Demo Mode"
      >
        <Power className="w-4 h-4" />
      </button>
    </div>
  );
};

export default DemoModeIndicator; 