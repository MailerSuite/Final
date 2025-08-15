import { useEffect, useState } from "react";
import { createWebSocket } from "@/utils/websocket";
import ProgressBar from "./ProgressBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CirclePause, Paintbrush, Power, Copy } from "lucide-react";

interface LiveConsoleProps {
  url: string;
}

interface LogEntry {
  timestamp: string;
  message: string;
}

const LiveConsole = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [progress, setProgress] = useState<number | undefined>();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let base = (import.meta.env.VITE_API_BASE as string) || "/api/v1";
    base = base.replace(/^https?:\/\//, "");
    const url = `${protocol}//${base}/ws/imap/metrics`;
    if (!connected) return;
    const ws = createWebSocket(url);
    ws.onmessage = (e) => {
      const raw = e.data as string;
      try {
        const data = JSON.parse(raw);
        if (typeof data.progress === "number") {
          setProgress(data.progress);
        }
        if (data.message) {
          setLogs((l) => [
            ...l,
            {
              timestamp: new Date().toLocaleTimeString(),
              message: data.message,
            },
          ]);
        }
      } catch {
        const match = raw.match(/^\[(.*?)\]\s*(.*)$/);
        if (match) {
          setLogs((l) => [...l, { timestamp: match[1], message: match[2] }]);
        } else {
          setLogs((l) => [
            ...l,
            { timestamp: new Date().toLocaleTimeString(), message: raw },
          ]);
        }
      }
    };
    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
      setLogs((l) => [
        ...l,
        {
          timestamp: new Date().toLocaleTimeString(),
          message: `WebSocket error: ${
            e instanceof Event && "code" in e ? (e as CloseEvent).code : ""
          } ${(e as any).message || ""}`.trim(),
        },
      ]);
    };
    ws.onclose = (event) => {
      const msg = `WebSocket closed: code=${event.code} reason=${event.reason}`;
      console.log(msg);
      setLogs((l) => [
        ...l,
        { timestamp: new Date().toLocaleTimeString(), message: msg },
      ]);
    };
    return () => {
      ws.close();
      setProgress(100);
    };
  }, [url, connected]);

  const start = () => {
    setProgress(undefined);
    setConnected(true);
  };
  const stop = () => {
    setConnected(false);
    setProgress(100);
  };
  const clear = () => {
    setLogs([])
    setProgress(undefined)
  }
  const copyLogs = async () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.message}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* no-op */
    }
  };

  return (
    <Card className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <CardTitle>Console</CardTitle>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button onClick={start} disabled={connected}>
            <Power className="mr-1 h-4 w-4" />
            <span>Start</span>
          </Button>
          <Button onClick={stop} disabled={!connected}>
            <CirclePause className="mr-1 h-4 w-4" />
            <span>Stop</span>
          </Button>
          <Button variant="outline" onClick={copyLogs}>
            <Copy className="mr-1 h-4 w-4" />
            Copy
          </Button>
          <Button variant="outline" onClick={clear}>
            <Paintbrush className="mr-1 h-4 w-4" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 relative">
        <ProgressBar progress={progress} active={connected} />
        <div className="border rounded-md p-2">
          <div className="grid grid-cols-2 gap-4 px-4 py-2 text-zinc-400 border-b border-zinc-700 sticky top-0 bg-dark z-5">
            <span>Timestamp</span>
            <span>Message</span>
          </div>
          <div className="space-y-1 mt-1 text-sm font-mono">
            {logs.map((log, i) => (
              <div key={i} className="grid grid-cols-2 gap-4">
                <span>{log.timestamp}</span>
                <span>{log.message}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-muted-foreground">
                Console output will appear here when available.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveConsole;
