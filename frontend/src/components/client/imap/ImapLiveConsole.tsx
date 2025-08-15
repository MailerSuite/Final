"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Play, Square, Trash2, Copy } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";
import { extractProgress } from "@/utils/progress";

interface ConsoleLog {
  id: string;
  timestamp: string;
  level: "info" | "success" | "error" | "warning" | "command";
  message: string;
  threadId?: number;
}

interface ImapLiveConsoleProps {
  logs: ConsoleLog[];
  addConsoleLog: (
    level: ConsoleLog["level"],
    message: string,
    threadId?: number
  ) => void;
  isRunning: boolean;
  onStartTest: () => void;
  onStopTest: () => void;
  onClearResults: () => void;
}

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
};

export function ImapLiveConsole({
  logs,
  addConsoleLog,
  isRunning,
  onStartTest,
  onStopTest,
  onClearResults,
}: ImapLiveConsoleProps) {
  const [height, setHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const [progress, setProgress] = useState<number | undefined>();
  const consoleRef = useRef<HTMLDivElement>(null);
  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(
        logs.map((l) => `[${l.timestamp}] ${l.message}`).join('\n')
      );
    } catch {
      /* no-op */
    }
  };

  const startResize = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newHeight = window.innerHeight - e.clientY - 20;
        setHeight(Math.max(200, Math.min(600, newHeight)));
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResize);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [resize, stopResize]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

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

  const handleCommandSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && commandInput.trim() !== "") {
      addConsoleLog("command", `> ${commandInput}`);
      processCommand(commandInput.trim());
      setCommandInput("");
    }
  };

  const processCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    if (lowerCommand === "help") {
      addConsoleLog(
        "info",
        "Available commands: help, clear, echo [message], status"
      );
    } else if (lowerCommand === "clear") {
      addConsoleLog("info", "Console cleared (simulated).");
    } else if (lowerCommand === "status") {
      addConsoleLog("info", `System status: ${isRunning ? "Running" : "Idle"}`);
    } else if (lowerCommand.startsWith("echo ")) {
      const message = command.substring(5).trim();
      addConsoleLog("info", message);
    } else {
      addConsoleLog("error", `Unknown command: ${command}`);
    }
  };

  return (
    <Card className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <motion.div animate={isRunning ? pulseVariants.pulse : {}}>
              <Activity className="w-5 h-5 text-red-500" />
            </motion.div>
            <CardTitle className="text-base font-semibold text-white">
              Live Console
            </CardTitle>
            {isRunning && (
              <Badge
                variant="secondary"
                className="bg-red-500/20 text-red-400 border-red-500/30"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Button
              onClick={onStartTest}
              disabled={isRunning}
              size="sm"
              className="flex-1 lg:flex-none bg-red-600 hover:bg-red-700 text-white min-w-[100px]"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Test
            </Button>
            <Button
              onClick={onStopTest}
              disabled={!isRunning}
              size="sm"
              variant="destructive"
              className="flex-1 lg:flex-none min-w-[100px]"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Test
            </Button>
            <Button
              onClick={copyLogs}
              disabled={isRunning}
              size="sm"
              variant="outline"
              className="border-zinc-600 hover:bg-zinc-700 px-3"
              aria-label="Copy logs to clipboard"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => {
                setProgress(undefined)
                onClearResults()
              }}
              disabled={isRunning}
              size="sm"
              variant="outline"
              className="border-zinc-600 hover:bg-zinc-700 px-3"
              aria-label="Clear console and results"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Real-time monitoring and control center for IMAP testing operations.
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow flex flex-col min-h-0">
        <ProgressBar progress={progress} active={isRunning} />
        <div
          ref={consoleRef}
          className="bg-zinc-950 p-4 rounded-md overflow-y-auto font-mono text-xs space-y-1 border border-zinc-800 flex-grow scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
          style={{ height: `${height}px` }}
        >
          <AnimatePresence>
            {logs.length === 0 ? (
              <motion.div
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                🚀 IMAP Checker Console Ready - Waiting for commands and test results...
              </motion.div>
            ) : (
              logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-2 items-start"
                >
                  <span className="text-muted-foreground flex-shrink-0">[{log.timestamp}]</span>
                  {log.threadId && (
                    <span className="text-blue-500 flex-shrink-0">[T{log.threadId}]</span>
                  )}
                  <span
                    className={`flex-1 ${
                      log.level === "success"
                        ? "text-green-400"
                        : log.level === "error"
                        ? "text-red-400"
                        : log.level === "warning"
                        ? "text-yellow-400"
                        : log.level === "command"
                        ? "text-purple-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {log.message}
                  </span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
        <div
          className="w-full h-2 bg-border cursor-ns-resize rounded-b-md hover:bg-red-500 transition-colors flex-shrink-0 mt-1"
          onMouseDown={startResize}
          title="Drag to resize console"
        />
        <div className="flex gap-2 mt-2 flex-shrink-0">
          <Input
            placeholder="Enter command (help for available commands)..."
            className="flex-1 h-8 text-xs bg-zinc-950 border-zinc-600 text-white"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={handleCommandSubmit}
          />
          <Button
            onClick={() => {
              if (commandInput.trim()) {
                addConsoleLog("command", `> ${commandInput}`);
                processCommand(commandInput.trim());
                setCommandInput("");
              }
            }}
            size="sm"
            variant="outline"
            className="border-zinc-600 hover:bg-zinc-700 px-3"
          >
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ImapLiveConsole;
