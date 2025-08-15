import { useEffect, useMemo, useState } from 'react';

const TRIAL_LOCAL_STORAGE_KEY = 'ms_trial_start_iso';
const TRIAL_DURATION_DAYS = 30;

function readOrInitTrialStart(): Date {
  try {
    const existing = localStorage.getItem(TRIAL_LOCAL_STORAGE_KEY);
    if (existing) {
      const parsed = new Date(existing);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    const now = new Date();
    localStorage.setItem(TRIAL_LOCAL_STORAGE_KEY, now.toISOString());
    return now;
  } catch {
    // Fallback: if localStorage is unavailable, assume trial started now
    return new Date();
  }
}

function differenceInDays(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((utcTo - utcFrom) / msPerDay);
}

export type TrialInfo = {
  isTrialActive: boolean;
  daysLeft: number; // 0 if expired
  trialEndsOn: Date;
  trialStartedOn: Date;
};

export function useTrial(): TrialInfo {
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000); // update once per minute
    return () => clearInterval(id);
  }, []);

  const info = useMemo<TrialInfo>(() => {
    const start = readOrInitTrialStart();
    const now = new Date(nowTick);
    const daysUsed = Math.max(0, differenceInDays(start, now));
    const daysLeft = Math.max(0, TRIAL_DURATION_DAYS - daysUsed);
    const endsOn = new Date(start);
    endsOn.setDate(start.getDate() + TRIAL_DURATION_DAYS);
    return {
      isTrialActive: daysLeft > 0,
      daysLeft,
      trialEndsOn: endsOn,
      trialStartedOn: start,
    };
  }, [nowTick]);

  return info;
}

export function isTrialActiveNow(): boolean {
  const start = readOrInitTrialStart();
  const now = new Date();
  const daysUsed = Math.max(0, differenceInDays(start, now));
  return TRIAL_DURATION_DAYS - daysUsed > 0;
}
