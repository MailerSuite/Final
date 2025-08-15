import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, Folder, ExternalLink, Copy, Check, X } from 'lucide-react';
import routeRegistry from '@/nav/route-registry.json';

interface RouteItem {
  path: string;
  title: string;
  section?: string;
  layout?: string;
  file?: string;
  notes?: string;
  children?: RouteItem[];
}

export default function DebugNavigator() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['client', 'admin', 'showcase']));
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [showOnlyBroken, setShowOnlyBroken] = useState(false);

  const flattenRoutes = (routes: RouteItem[], parent?: string): RouteItem[] => {
    return routes.reduce((acc: RouteItem[], route) => {
      const fullRoute = { ...route, parent };
      acc.push(fullRoute);
      if (route.children) {
        acc.push(...flattenRoutes(route.children, route.path));
      }
      return acc;
    }, []);
  };

  const allRoutes = useMemo(() => flattenRoutes(routeRegistry.routes), []);

  const filteredRoutes = useMemo(() => {
    let filtered = allRoutes;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(route => 
        route.path.toLowerCase().includes(term) ||
        route.title.toLowerCase().includes(term) ||
        route.file?.toLowerCase().includes(term) ||
        route.section?.toLowerCase().includes(term) ||
        route.notes?.toLowerCase().includes(term)
      );
    }

    if (showOnlyBroken) {
      filtered = filtered.filter(route => route.notes?.includes('broken') || route.notes?.includes('missing'));
    }

    return filtered;
  }, [allRoutes, searchTerm, showOnlyBroken]);

  const groupedRoutes = useMemo(() => {
    const groups: Record<string, RouteItem[]> = {};
    filteredRoutes.forEach(route => {
      const section = route.section || 'other';
      if (!groups[section]) groups[section] = [];
      groups[section].push(route);
    });
    return groups;
  }, [filteredRoutes]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(text);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getSectionColor = (section: string) => {
    const colors: Record<string, string> = {
      client: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
      admin: 'text-red-500 border-red-500/20 bg-red-500/5',
      showcase: 'text-purple-500 border-purple-500/20 bg-purple-500/5',
      auth: 'text-green-500 border-green-500/20 bg-green-500/5',
      public: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5',
      legacy: 'text-muted-foreground border-border/20 bg-muted/5',
      development: 'text-pink-500 border-pink-500/20 bg-pink-500/5',
      debug: 'text-orange-500 border-orange-500/20 bg-orange-500/5',
    };
    return colors[section] || 'text-muted-foreground border-border/20 bg-muted/5';
  };

  return (
    <div className="min-h-screen bg-background text-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                🚀 Debug Navigator
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {routeRegistry.metadata.totalRoutes} routes • {Object.keys(groupedRoutes).length} sections • {routeRegistry.metadata.framework} framework
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOnlyBroken(!showOnlyBroken)}
                className={`px-3 py-1 text-xs rounded-md transition ${
                  showOnlyBroken 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'bg-card text-muted-foreground border border-border hover:bg-muted'
                }`}
              >
                {showOnlyBroken ? '⚠️ Showing Broken' : 'Show All'}
              </button>
              <Link 
                to="/" 
                className="px-3 py-1 text-xs bg-card text-muted-foreground rounded-md border border-border hover:bg-muted transition"
              >
                ← Back to App
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search routes, files, sections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Route Sections */}
      <div className="container mx-auto px-4 py-6">
        {Object.entries(groupedRoutes).map(([section, routes]) => (
          <div key={section} className="mb-6">
            <button
              onClick={() => toggleSection(section)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border ${getSectionColor(section)} cursor-pointer hover:opacity-80 transition`}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                <span className="font-semibold capitalize">{section}</span>
                <span className="text-xs opacity-60">({routes.length})</span>
              </div>
              <span className="text-xs">{expandedSections.has(section) ? '−' : '+'}</span>
            </button>

            {expandedSections.has(section) && (
              <div className="mt-2 space-y-1 pl-4">
                {routes.map((route) => (
                  <div
                    key={`${route.path}::${route.file || route.title}`}
                    className="group relative flex items-start gap-3 p-3 bg-background/50 border border-border rounded-lg hover:bg-background transition"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={route.path}
                          className="text-blue-400 hover:text-blue-300 font-medium text-sm hover:underline"
                        >
                          {route.path}
                        </Link>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground text-sm">• {route.title}</span>
                        {route.layout && (
                          <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded">
                            {route.layout}
                          </span>
                        )}
                      </div>
                      
                      {route.file && (
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs text-muted-foreground font-mono">{route.file}</code>
                          <button
                            onClick={() => copyToClipboard(route.file!)}
                            className="opacity-0 group-hover:opacity-100 transition"
                          >
                            {copiedPath === route.file ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-muted-foreground hover:text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      )}
                      
                      {route.notes && (
                        <p className={`text-xs mt-1 ${
                          route.notes.includes('broken') || route.notes.includes('missing') 
                            ? 'text-red-400' 
                            : 'text-muted-foreground'
                        }`}>
                          ℹ️ {route.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredRoutes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">No routes found</p>
            <p className="text-sm">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-400">{filteredRoutes.length}</p>
              <p className="text-xs text-muted-foreground">Visible Routes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">
                {filteredRoutes.filter(r => !r.notes?.includes('broken')).length}
              </p>
              <p className="text-xs text-muted-foreground">Working</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">
                {filteredRoutes.filter(r => r.notes?.includes('legacy')).length}
              </p>
              <p className="text-xs text-muted-foreground">Legacy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">
                {filteredRoutes.filter(r => r.notes?.includes('broken')).length}
              </p>
              <p className="text-xs text-muted-foreground">Need Fix</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}