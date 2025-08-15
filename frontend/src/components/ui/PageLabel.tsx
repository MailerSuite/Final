import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, Copy, Check, X, Eye, EyeOff } from 'lucide-react';
const routeRegistry: unknown = { routes: [] };
try {
  // Optional; only in dev projects that provide registry
  // Using dynamic import to avoid require()
  // routeRegistry = require('@/nav/route-registry.json');
} catch {}

interface RouteInfo {
  path: string;
  title: string;
  file?: string;
  section?: string;
  notes?: string;
}

export default function PageLabel() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Check if debug mode is enabled
  const isDebugMode = import.meta.env.VITE_DEBUG_UI === 'true' || 
                     import.meta.env.MODE === 'development';

  useEffect(() => {
    if (!isDebugMode) return;

    // Find matching route in registry
    const findRoute = (routes: unknown[], path: string): RouteInfo | null => {
      for (const route of routes) {
        if (route.path === path) {
          return route;
        }
        if (route.children) {
          const found = findRoute(route.children, path);
          if (found) return found;
        }
      }
      return null;
    };

    const info = findRoute(routeRegistry.routes, location.pathname);
    if (info) {
      setRouteInfo(info);
    } else {
      // Fallback for routes not in registry
      setRouteInfo({
        path: location.pathname,
        title: 'Unknown Page',
        notes: 'Route not found in registry'
      });
    }
  }, [location, isDebugMode]);

  const copyToClipboard = () => {
    const text = JSON.stringify({
      path: routeInfo?.path,
      file: routeInfo?.file,
      title: routeInfo?.title
    }, null, 2);
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isDebugMode || !isVisible || !routeInfo) return null;

  const getSectionColor = (section?: string) => {
    const colors: Record<string, string> = {
      client: 'from-blue-500 to-blue-600',
      admin: 'from-red-500 to-red-600',
      showcase: 'from-purple-500 to-purple-600',
      auth: 'from-green-500 to-green-600',
      public: 'from-yellow-500 to-yellow-600',
      legacy: 'from-gray-500 to-gray-600',
      development: 'from-pink-500 to-pink-600',
    };
    return colors[section || ''] || 'from-gray-500 to-gray-600';
  };

  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-[9999]">
        <button
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-2 px-3 py-1.5 bg-background/95 backdrop-blur border border-border rounded-full shadow-lg hover:bg-card transition-all"
        >
          <Eye className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-mono">Debug</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm">
      <div className="bg-background/95 backdrop-blur border border-border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-3 py-2 bg-gradient-to-r ${getSectionColor(routeInfo.section)} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3 text-white/80" />
            <span className="text-xs font-semibold text-white">
              Page Debug Info
            </span>
            {routeInfo.section && (
              <span className="text-xs px-2 py-0.5 bg-white/20 rounded text-white/90 capitalize">
                {routeInfo.section}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-white/20 rounded transition"
              title="Minimize"
            >
              <EyeOff className="w-3 h-3 text-white/80" />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/20 rounded transition"
              title="Close"
            >
              <X className="w-3 h-3 text-white/80" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Title */}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Title</p>
            <p className="text-sm text-foreground font-medium">{routeInfo.title}</p>
          </div>

          {/* Path */}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Route Path</p>
            <code className="text-xs text-blue-400 font-mono block bg-card px-2 py-1 rounded">
              {routeInfo.path}
            </code>
          </div>

          {/* File */}
          {routeInfo.file && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Component File</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-green-400 font-mono flex-1 bg-card px-2 py-1 rounded truncate">
                  {routeInfo.file}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="p-1 hover:bg-muted rounded transition"
                  title="Copy info"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          {routeInfo.notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Notes</p>
              <p className={`text-xs ${
                routeInfo.notes.includes('broken') || routeInfo.notes.includes('missing')
                  ? 'text-red-400'
                  : 'text-yellow-400'
              }`}>
                ⚠️ {routeInfo.notes}
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-2 border-t border-border flex items-center gap-2">
            <a
              href="/__all-pages"
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
            >
              → View All Routes
            </a>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => console.log('Route Info:', routeInfo)}
              className="text-xs text-muted-foreground hover:text-muted-foreground"
            >
              Log to Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to inject PageLabel into any component
export function usePageLabel() {
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const isDebug = import.meta.env.VITE_DEBUG_UI === 'true' || 
                   import.meta.env.MODE === 'development';
    setShowLabel(isDebug);
  }, []);

  return showLabel ? <PageLabel /> : null;
}