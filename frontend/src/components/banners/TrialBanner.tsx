import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTrial } from '@/hooks/useTrial';

const DISMISS_KEY = 'ms_trial_banner_dismissed_until';

function useDismissState(endsOnIso: string) {
  const [dismissed, setDismissed] = React.useState<boolean>(false);
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(DISMISS_KEY);
      if (saved && saved === endsOnIso) {
        setDismissed(true);
      }
    } catch { }
  }, [endsOnIso]);

  const dismiss = React.useCallback(() => {
    try { localStorage.setItem(DISMISS_KEY, endsOnIso); } catch { }
    setDismissed(true);
  }, [endsOnIso]);

  return { dismissed, dismiss };
}

export const TrialBanner: React.FC = () => {
  const { isTrialActive, daysLeft, trialEndsOn } = useTrial();
  const endsOnIso = React.useMemo(() => trialEndsOn.toISOString(), [trialEndsOn]);
  const { dismissed, dismiss } = useDismissState(endsOnIso);

  // Disable in dev mode to avoid any potential issues
  if (import.meta.env.DEV) {
    return null;
  }

  if (!isTrialActive || dismissed) return null;

  return (
    <div className="px-4">
      <Alert className="mb-3 bg-amber-500/10 border-amber-500/30 text-amber-200">
        <AlertDescription className="flex items-center justify-between gap-3">
          <span className="text-sm">
            All features are unlocked during your first month. <span className="font-semibold">{daysLeft} days left</span> in your trial.
          </span>
          <div className="shrink-0 flex items-center gap-2">
            <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-200" onClick={dismiss}>Dismiss</Button>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">Upgrade</Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TrialBanner;
