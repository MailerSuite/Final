import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "../../store/auth";

interface SecurityContextType {
  csrfToken: string;
  sessionId: string;
  lastActivity: Date;
  securityLevel: "low" | "medium" | "high";
  refreshSecurity: () => void;
  validateSession: () => boolean;
  isSessionValid: boolean;
  isWithinRateLimit: (action: string) => Promise<boolean>;
  getCurrentUsage: () => { requests: number; errors: number };
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error("useSecurityContext must be used within SecurityProvider");
  }
  return context;
};

export const SecurityProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const ACTIVITY_TRACKING_ENABLED = false;
  const [csrfToken, setCsrfToken] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [lastActivity, setLastActivity] = useState(new Date());
  const [securityLevel, setSecurityLevel] = useState<"low" | "medium" | "high">(
    "medium"
  );
  const [isSessionValid, setIsSessionValid] = useState(true);
  const { userData, token, setToken, setUserData } = useAuthStore();

  // Rate limiting state
  const [requestCount, setRequestCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  // Rate limiting functions
  const isWithinRateLimit = async (action: string): Promise<boolean> => {
    // Simple rate limiting implementation
    const now = Date.now();
    const rateLimitKey = `rateLimit_${action}_${now - (now % 60000)}`; // Per minute window
    
    try {
      const stored = localStorage.getItem(rateLimitKey);
      const currentCount = stored ? parseInt(stored) : 0;
      
      if (currentCount >= 100) { // 100 requests per minute limit
        return false;
      }
      
      localStorage.setItem(rateLimitKey, (currentCount + 1).toString());
      setRequestCount(prev => prev + 1);
      return true;
    } catch (error) {
      setErrorCount(prev => prev + 1);
      return true; // Allow on error to prevent blocking
    }
  };

  const getCurrentUsage = () => {
    return {
      requests: requestCount,
      errors: errorCount
    };
  };

  const generateCSRFToken = () => {
    const token = btoa(
      Math.random().toString() + Date.now().toString()
    ).substring(0, 32);
    setCsrfToken(token);
    return token;
  };

  const generateSessionId = () => {
    const id = btoa(Date.now().toString() + Math.random().toString()).substring(
      0,
      16
    );
    setSessionId(id);
    return id;
  };

  const validateSession = () => {
    if (!token || !userData) {
      setIsSessionValid(false);
      return false;
    }

    // COMPLETE FRONTEND SESSION VALIDATION DISABLE
    // Let backend handle ALL token expiry validation
    // Frontend only checks if user is active, no time-based validation
    if (!userData.is_active) {
      logout();
      setIsSessionValid(false);
      return false;
    }

    setIsSessionValid(true);
    return true;
  };

  const logout = () => {
    setToken(null);
    setUserData(null);
    localStorage.removeItem("token");
    sessionStorage.clear();

    setCsrfToken("");
    setSessionId("");
    if (ACTIVITY_TRACKING_ENABLED) {
      setLastActivity(new Date());
    }
  };

  const refreshSecurity = () => {
    generateCSRFToken();
    if (ACTIVITY_TRACKING_ENABLED) {
      setLastActivity(new Date());
    }
  };

  useEffect(() => {
    if (!ACTIVITY_TRACKING_ENABLED) {
      return;
    }

    const trackActivity = () => {
      setLastActivity(new Date());
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, trackActivity);
      });
    };
  }, []);

  // DISABLE AGGRESSIVE SESSION VALIDATION - let backend handle token expiry
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (token && userData) {
  //       validateSession();
  //     }
  //   }, 300000);
  //   return () => clearInterval(interval);
  // }, [token, userData, lastActivity, validateSession]);

  useEffect(() => {
    if (userData && token) {
      generateCSRFToken();
      generateSessionId();

      if (userData.is_admin) {
        setSecurityLevel("high");
      } else {
        setSecurityLevel("medium");
      }

      // DISABLE CLIENT-SIDE TOKEN EXPIRY CHECKS - let HTTP interceptors handle this
      // Frontend token validation can cause race conditions with backend
      // try {
      //   const tokenParts = token.split(".");
      //   if (tokenParts.length === 3) {
      //     const payload = JSON.parse(atob(tokenParts[1]));
      //     const now = Math.floor(Date.now() / 1000);
      //     if (payload.exp && payload.exp < now) {
      //       logout();
      //       return;
      //     }
      //   }
      // } catch (error: unknown) {
      //   console.warn("Invalid token format", error);
      //   logout();
      //   return;
      // }

      setIsSessionValid(true);
    } else {
      setIsSessionValid(false);
    }
  }, [userData, token]);

  useEffect(() => {
    const detectSuspiciousActivity = () => {
      const tabId =
        sessionStorage.getItem("tabId") || Math.random().toString(36);
      sessionStorage.setItem("tabId", tabId);

      localStorage.setItem(
        "activeTab",
        JSON.stringify({
          tabId,
          timestamp: Date.now(),
          url: window.location.href,
        })
      );
    };

    detectSuspiciousActivity();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        localStorage.setItem("lastHidden", Date.now().toString());
      } else {
        const lastHidden = localStorage.getItem("lastHidden");
        if (lastHidden) {
          const hiddenTime = Date.now() - parseInt(lastHidden);
          if (hiddenTime > 5 * 60 * 1000) {
            validateSession();
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [validateSession]);

  const value = {
    csrfToken,
    sessionId,
    lastActivity,
    securityLevel,
    refreshSecurity,
    validateSession,
    isSessionValid,
    isWithinRateLimit,
    getCurrentUsage,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};
