import { useEffect, useState } from "react";
import { createWebSocket } from '@/utils/websocket'
import { formatWebSocketMessage } from '@/types/websocket'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProgressBar from "./ProgressBar";
import { Button } from "@/components/ui/button";
import { Terminal, X, Trash, Copy } from "lucide-react";
import { API_BASE } from "@/lib/api";

const GlobalConsole = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [progress, setProgress] = useState<number | undefined>();
  const [open, setOpen] = useState(false);

  const copyLogs = async () => {
    const text = messages.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* no-op */
    }
  };

  useEffect(() => {
    const url = new URL("/api/ws", API_BASE);
    url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = createWebSocket(url.toString());
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (typeof data.progress === "number") {
          setProgress(data.progress);
        }
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
          response: data.message || data.response,
          status: data.status,
        });
        setMessages((m) => [...m, message]);
      } catch {
        setMessages((m) => [...m, event.data]);
      }
    };
    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
      setMessages((m) => [
        ...m,
        `WebSocket error: ${(e as any).message || ''}`.trim(),
      ]);
    };
    ws.onclose = (event) => {
      const msg = `WebSocket closed: code=${event.code} reason=${event.reason}`;
      console.log(msg);
      setMessages((m) => [...m, msg]);
    };
    return () => ws.close();
  }, []);

  if (!open) {
    return (
      <Button className="fixed bottom-2 right-2 z-50" size="sm" onClick={() => setOpen(true)}>
        <Terminal className="mr-2 h-4 w-4" /> Console
      </Button>
    );
  }

  return (
    <div className="fixed bottom-2 right-2 z-50 w-80">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Live Progress</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            <X className="mr-1 h-4 w-4" /> Close
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <ProgressBar progress={progress} active={true} />
          <ScrollArea className="h-40 border rounded-md p-2">
            <div className="space-y-1 text-sm">
              {messages.map((m, i) => (
                <div key={i}>{m}</div>
              ))}
              {messages.length === 0 && (
                <p className="text-muted-foreground">Console output will appear here when available.</p>
              )}
            </div>
          </ScrollArea>
          <Button variant="ghost" size="sm" onClick={copyLogs}>
            <Copy className="mr-1 h-4 w-4" /> Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMessages([])
              setProgress(undefined)
            }}
          >
            <Trash className="mr-1 h-4 w-4 text-destructive" /> Clear
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalConsole;
