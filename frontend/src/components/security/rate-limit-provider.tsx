import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface RateLimitContextType {
  checkRateLimit: (action: string) => boolean;
  isRateLimited: boolean;
  remainingAttempts: number;
}

const RateLimitContext = createContext<RateLimitContextType | null>(null);

export const useRateLimit = () => {
  const context = useContext(RateLimitContext);
  if (!context) {
    throw new Error("useRateLimit must be used within RateLimitProvider");
  }
  return context;
};

interface RateLimitConfig {
  [key: string]: {
    maxAttempts: number;
    windowMs: number;
  };
}

const rateLimitConfig: RateLimitConfig = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  api_call: { maxAttempts: 100, windowMs: 60 * 1000 },
  password_reset: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
  admin_action: { maxAttempts: 10, windowMs: 60 * 1000 },
};

export const RateLimitProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [attempts, setAttempts] = useState<{
    [key: string]: { count: number; timestamp: number }[];
  }>({});
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(0);

  const checkRateLimit = (action: string): boolean => {
    const config = rateLimitConfig[action];
    if (!config) return true;
    const now = Date.now();
    const actionAttempts = attempts[action] || [];

    const validAttempts = actionAttempts.filter(
      (attempt) => now - attempt.timestamp < config.windowMs
    );

    if (validAttempts.length >= config.maxAttempts) {
      setIsRateLimited(true);
      setRemainingAttempts(0);
      return false;
    }

    const newAttempts = {
      ...attempts,
      [action]: [...validAttempts, { count: 1, timestamp: now }],
    };
    setAttempts(newAttempts);
    setRemainingAttempts(config.maxAttempts - validAttempts.length - 1);
    setIsRateLimited(false);

    return true;
  };

  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const cleanedAttempts: typeof attempts = {};

      Object.entries(attempts).forEach(([action, actionAttempts]) => {
        const config = rateLimitConfig[action];
        if (config) {
          cleanedAttempts[action] = actionAttempts.filter(
            (attempt) => now - attempt.timestamp < config.windowMs
          );
        }
      });

      setAttempts(cleanedAttempts);
    }, 60000);

    return () => clearInterval(cleanup);
  }, [attempts]);

  const value = {
    checkRateLimit,
    isRateLimited,
    remainingAttempts,
  };

  return (
    <RateLimitContext.Provider value={value}>
      {isRateLimited && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className="border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Rate limit exceeded. Please wait before trying again.
            </AlertDescription>
          </Alert>
        </div>
      )}
      {children}
    </RateLimitContext.Provider>
  );
};
