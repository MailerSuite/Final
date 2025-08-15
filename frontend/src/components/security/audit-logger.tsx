import type React from "react";
import { createContext, useContext, useEffect } from "react";
import { useAuthStore } from "../../store/auth";
import { useLocation } from "react-router-dom";

interface AuditEvent {
  timestamp: Date;
  userId?: string;
  action: string;
  resource?: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
  details?: unknown;
}

interface AuditContextType {
  logEvent: (
    event: Omit<AuditEvent, "timestamp" | "userId" | "ip" | "userAgent">
  ) => void;
  getAuditLogs: () => AuditEvent[];
}

const AuditContext = createContext<AuditContextType | null>(null);

export const useAuditLogger = () => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error("useAuditLogger must be used within SecurityAuditLogger");
  }
  return context;
};

export const SecurityAuditLogger = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userData } = useAuthStore();
  const location = useLocation();

  const logEvent = (
    event: Omit<AuditEvent, "timestamp" | "userId" | "ip" | "userAgent">
  ) => {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date(),
      userId: userData?.id,
      ip: "client-side",
      userAgent: navigator.userAgent,
    };

    const existingLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]");
    const updatedLogs = [...existingLogs, auditEvent].slice(-1000);
    localStorage.setItem("auditLogs", JSON.stringify(updatedLogs));

    if (
      event.action.includes("security") ||
      event.action.includes("auth") ||
      !event.success
    ) {
      console.warn("Security Event:", auditEvent);
    }
  };

  const getAuditLogs = (): AuditEvent[] => {
    return JSON.parse(localStorage.getItem("auditLogs") || "[]");
  };

  useEffect(() => {
    logEvent({
      action: "route_access",
      resource: location.pathname,
      success: true,
      details: { route: location.pathname, search: location.search },
    });
  }, [location, logEvent]);

  useEffect(() => {
    if (userData) {
      logEvent({
        action: "user_session_active",
        success: true,
      });
    }
  }, [userData, logEvent]);

  const value = {
    logEvent,
    getAuditLogs,
  };

  return (
    <AuditContext.Provider value={value}>{children}</AuditContext.Provider>
  );
};
