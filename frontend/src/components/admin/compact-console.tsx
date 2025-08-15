"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createWebSocket } from '@/utils/websocket';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Play,
  Square,
  Trash2,
  ChevronDown,
  ChevronUp,
  Inbox,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { formatWebSocketMessage } from "@/types/websocket";
import ProgressBar from "./ProgressBar";
import { extractProgress } from "@/utils/progress";
import { Badge } from "@/components/ui/badge";

interface ConsoleLog {
  id: string;
  timestamp: string;
  level:
  | "info"
  | "success"
  | "error"
  | "warning"
  | "command"
  | "valid"
  | "invalid"
  | "dead"
  | "idle";
  message: string;
  threadId?: number;
}

interface ImapConfig {
  id: string;
  name: string;
  host?: string;
  firewallEnabled?: boolean;
  isCustomProxy?: boolean;
}

interface CompactConsoleProps {
  logs: ConsoleLog[];
  addConsoleLog: (
    level: ConsoleLog["level"],
    message: string,
    threadId?: number
  ) => void;
  onClearResults: () => void;
  imapConfigs?: ImapConfig[];
  selectedImapConfigId?: string | null;
  onSelectImapConfig?: (configId: string) => void;
  selectPlaceholder?: string;
  wsUrl?: string;
}

export function CompactConsole({
  logs,
  addConsoleLog,
  onClearResults,
  imapConfigs = [],
  selectedImapConfigId = "",
  onSelectImapConfig = () => { },
  selectPlaceholder,
  wsUrl,
}: CompactConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState<number | undefined>();
  const wsRef = useRef<WebSocket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pendingStartRef = useRef(false);
  const pendingConfigRef = useRef<string | null>(null);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const wsProtocol =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "wss"
      : "ws";
  const WS_BASE =
    wsUrl || `${wsProtocol}://78.159.131.121:8000/api/v1/ws/monitor.checks`;

  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (scrollAreaRef.current) {
      const behavior = reduceMotion ? "auto" : "smooth";
      const el = scrollAreaRef.current;
      if (typeof el.scrollTo === "function") {
        el.scrollTo({ top: el.scrollHeight, behavior });
      } else {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [logs, reduceMotion]);

  useEffect(() => {
    const last = logs[logs.length - 1]
    if (last) {
      const p = extractProgress(last.message)
      if (p !== undefined) setProgress(p)
    }
  }, [logs])

  useEffect(() => {
    if (!isRunning) setProgress(undefined)
  }, [isRunning])

  const connectWebSocket = () => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      addConsoleLog("error", `Max reconnect attempts reached.`);
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    addConsoleLog("info", "Connecting to WebSocket...");

    try {
      wsRef.current = createWebSocket(WS_BASE);
      const ws = wsRef.current;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setIsConnected(true);
        addConsoleLog("success", "WebSocket connected.");
        if (pendingStartRef.current && pendingConfigRef.current) {
          ws.send(
            JSON.stringify({
              command: "start",
              imap_config_id: pendingConfigRef.current,
            })
          );
          addConsoleLog(
            "command",
            `Started test for ${pendingConfigRef.current}`
          );
          setIsRunning(true);
          pendingStartRef.current = false;
          pendingConfigRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          const message = formatWebSocketMessage({
            timestamp: new Date().toISOString(),
            thread: data.thread_id || data.threadId,
            progress:
              typeof data.progress === "number"
                ? `${data.progress}`
                : data.current && data.total
                  ? `${data.current}/${data.total}`
                  : undefined,
            socks: data.socks_if,
            response: data.response,
            status: data.status,
          });

          addConsoleLog(
            data.status?.toLowerCase() || "info",
            message,
            data.thread_id || data.threadId
          );

          if (data.status === "running") setIsRunning(true);
          if (data.status === "stopped" || data.status === "completed")
            setIsRunning(false);
        } catch {
          // addConsoleLog("error", `Invalid message: ${event.data}`);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setIsConnected(false);
        addConsoleLog("error", "WebSocket error occurred.");
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsRunning(false);

        if (event.code !== 1000) {
          reconnectAttemptsRef.current += 1;
          addConsoleLog(
            "warning",
            `Disconnected: ${event.code} - ${event.reason}`
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            addConsoleLog(
              "info",
              `Reconnecting... (${reconnectAttemptsRef.current})`
            );
            connectWebSocket();
          }, 3000);
        } else {
          addConsoleLog("info", "WebSocket closed normally.");
        }
        wsRef.current = null;
      };
    } catch (err) {
      // addConsoleLog("error", `WebSocket failed: ${err}`);
    }
  };

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, "Component unmount");
      }
    };
  }, []);

  const startMonitoring = () => {
    if (!selectedImapConfigId) {
      addConsoleLog("error", "Select a config to test.");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          command: "start",
          imap_config_id: selectedImapConfigId,
        })
      );
      addConsoleLog("command", `Started test for ${selectedImapConfigId}`);
      setIsRunning(true);
    } else {
      pendingStartRef.current = true;
      pendingConfigRef.current = selectedImapConfigId;
      connectWebSocket();
    }
  };

  const stopMonitoring = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          command: "stop",
          imap_config_id: selectedImapConfigId,
        })
      );
      addConsoleLog("command", "Stopped test.");
      setIsRunning(false);
    } else {
      addConsoleLog("error", "WebSocket not connected.");
      setIsRunning(false);
    }
  };

  const getLogColor = (level: ConsoleLog["level"]) => {
    switch (level) {
      case "error":
        return "text-red-400";
      case "success":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "command":
        return "text-blue-400";
      case "valid":
        return "text-green-500";
      case "invalid":
      case "dead":
        return "text-red-500";
      case "idle":
        return "text-green-500";
      case "info":
      default:
        return "text-muted-foreground";
    }
  };

  const canStart = !isRunning && selectedImapConfigId;
  const canStop = isRunning;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="dark:bg-surface border border-border dark:border-border rounded-lg shadow-xl overflow-hidden"
    >
      <div className="p-3 flex flex-col sm:flex-row items-center justify-between border-b border-border">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:bg-muted"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
            <span className="ml-2 font-semibold">Live Console</span>
            <div
              className={`ml-2 w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"
                }`}
            />
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Inbox className="w-4 h-4 text-muted-foreground mr-2 ml-2" />
                  <Select
                    value={selectedImapConfigId || ""}
                    onValueChange={onSelectImapConfig}
                    disabled={
                      isRunning || (imapConfigs && imapConfigs?.length === 0)
                    }
                  >
                    <SelectTrigger className="h-9 text-xs w-[180px] bg-surface-1 border-border text-white">
                      <SelectValue placeholder={selectPlaceholder || "Select IMAP Config"} />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-2 border-border text-white">
                      {imapConfigs && imapConfigs.length === 0 ? (
                        <SelectItem value="no-configs" disabled>
                          No configs available
                        </SelectItem>
                      ) : (
                        imapConfigs &&
                        imapConfigs.map((config) => (
                          <SelectItem key={config.id} value={config.id}>
                            <div className="flex items-center space-x-2">
                              <span>{config.name}</span>
                              {config.firewallEnabled !== undefined && (
                                <Badge>
                                  {config.firewallEnabled ? "Enabled" : "Disabled"}
                                </Badge>
                              )}
                              {config.isCustomProxy && <Badge>Custom Proxy</Badge>}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-black text-white border-border">
                <p>Select a config to run tests.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={isRunning ? stopMonitoring : startMonitoring}
                  size="sm"
                  className={`${isRunning
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                    } text-white`}
                  disabled={isRunning ? !canStop : !canStart}
                >
                  {isRunning ? (
                    <Square className="w-4 h-4 mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {isRunning ? "Stop Test" : "Start Test"}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-black text-white border-border">
                <p>{isRunning ? "Stop current test" : "Start new test"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => {
                    setProgress(undefined)
                    onClearResults()
                  }}
                  variant="outline"
                  size="sm"
                  className="border-border text-muted-foreground hover:bg-muted hover:text-white"
                  disabled={isRunning}
                >
                  <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                  Clear
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-black text-white border-border">
                <p>Clear all logs</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <ProgressBar progress={progress} className="" />
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div
              ref={scrollAreaRef}
              role="log"
              aria-live="polite"
              tabIndex={0}
              className="p-3 dark:bg-surface-1 bg-muted rounded h-48 overflow-y-auto font-mono text-sm space-y-1.5"
            >
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Console is empty. Start a test to see logs.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start ${getLogColor(
                      log.level
                    )}`}
                  >
                    <span className="text-muted-foreground mr-2 select-none">
                      {log.timestamp} |
                    </span>
                    {log.threadId && (
                      <span className="text-purple-400 mr-1">
                        [T{log.threadId}] |
                      </span>
                    )}
                    <span className="flex-1 whitespace-pre-wrap break-all">
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
