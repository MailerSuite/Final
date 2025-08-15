import { Bot, MoreVertical, RefreshCw, Settings, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ModelSelector from "./ModelSelector";

interface ChatHeaderProps {
  connectionStatus: "online" | "offline" | "connecting";
  isTyping: boolean;
  model: string;
  onModelChange: (value: string) => void;
  onClear?: () => void;
}

export default function ChatHeader({
  connectionStatus,
  isTyping,
  model,
  onModelChange,
  onClear,
}: ChatHeaderProps) {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "online":
        return "bg-primary";
      case "offline":
        return "bg-red-900";
      case "connecting":
        return "bg-primary/70";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="relative bg-primary rounded-xl">
          <div className="p-3 rounded-2xl shadow-lg">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold text-white">AI Marketing Assistant</h3>
            <Badge variant="secondary" aria-label="Plan: Pro">Pro</Badge>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} ring-2 ring-background shadow-lg`}></div>
            <span className="text-sm text-muted-foreground capitalize font-medium">
              {connectionStatus}
            </span>
            {isTyping && (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[0, 0.1, 0.2].map((delay, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground font-medium">AI is thinking...</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <ModelSelector value={model} onChange={onModelChange} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-text hover:text-white hover:bg-primary/20 h-10 w-10 p-0 rounded-xl"
              aria-label="More actions"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-dark2 backdrop-blur-xl border-border dark:border-border text-base"
          >
            <DropdownMenuItem onClick={onClear} className="hover:bg-primary/20">
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Chat
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-primary/20">
              <Settings className="h-4 w-4 mr-2" />
              AI Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
