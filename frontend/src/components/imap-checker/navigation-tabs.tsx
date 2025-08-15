import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface NavigationTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

interface NavigationTabsProps {
  tabs: NavigationTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className
}) => {
  return (
    <div className={cn("flex flex-wrap gap-2 border-b border-border", className)}>
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? "primary" : "outline"}
          size="sm"
          onClick={() => onTabChange(tab.id)}
          disabled={tab.disabled}
          className={cn(
            "flex items-center gap-2 transition-all",
            activeTab === tab.id 
              ? "bg-red-600 hover:bg-red-700 text-white border-red-600" 
              : "border-border hover:border-red-600/50 text-muted-foreground hover:text-white"
          )}
        >
          {tab.icon && <span className="text-sm">{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.badge && (
            <span className={cn(
              "px-2 py-0.5 text-xs rounded-full",
              activeTab === tab.id 
                ? "bg-white/20 text-white" 
                : "bg-muted text-muted-foreground"
            )}>
              {tab.badge}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
};

export default NavigationTabs; 