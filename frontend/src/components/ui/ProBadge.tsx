import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isTrialActiveNow } from '@/hooks/useTrial';

export type ProBadgeProps = {
  className?: string;
  label?: string; // defaults to PRO
};

export const ProBadge: React.FC<ProBadgeProps> = ({ className, label = 'PRO' }) => {
  const trial = isTrialActiveNow();
  const message = trial
    ? 'Free during your first month'
    : 'Requires Pro after trial';
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={
            'inline-flex items-center rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-yellow-300 ' +
            (className ?? '')
          }>
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          <p className="text-xs">{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ProBadge;
