import React from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import ResponsiveGrid from '@/components/layout/ResponsiveGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Download, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Standard Page Template for SGPT Application
 * 
 * This template provides a consistent structure for all pages:
 * 1. Uses PageWrapper for consistent layout and title management
 * 2. Standard header with title, description, and action buttons
 * 3. Consistent spacing and grid layouts
 * 4. Proper error handling and loading states
 * 5. Standardized component imports from shadcn-ui
 * 
 * Usage:
 * - Copy this structure for new pages
 * - Customize the content while maintaining the layout patterns
 * - Ensure all imports follow this standardized pattern
 */

interface StandardPageProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
}

const StandardPageTemplate: React.FC<StandardPageProps> = ({
  title = "Page Title",
  description = "Page description explaining the purpose and functionality",
  children,
  actions,
  loading = false,
  error = null
}) => {
  return (
    <PageWrapper title={title}>
      <div className="space-y-8">
        {/* Standard Header Pattern */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-zinc-400">{description}</p>
          </div>
          
          {/* Standard Action Buttons Pattern */}
          {actions || (
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-zinc-800/60 border-zinc-700 hover:bg-zinc-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-zinc-800/60 border-zinc-700 hover:bg-zinc-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4 bg-zinc-700" />
                    <Skeleton className="h-3 w-1/2 bg-zinc-700" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full bg-zinc-700" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* Content Area */
          <div className="space-y-6">
            {children || (
              /* Default Content Example */
              <ResponsiveGrid>
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white">Example Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-400">
                      This is an example of standardized content layout.
                      Replace this with your actual page content.
                    </p>
                  </CardContent>
                </Card>
              </ResponsiveGrid>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default StandardPageTemplate;

/**
 * Standard Import Pattern for Pages:
 * 
 * import React, { useState, useEffect, useCallback } from 'react';
 * import { useNavigate } from 'react-router-dom';
 * import PageWrapper from '@/components/layout/PageWrapper';
 * import ResponsiveGrid from '@/components/layout/ResponsiveGrid';
 * import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 * import { Button } from '@/components/ui/button';
 * import { Badge } from '@/components/ui/badge';
 * import { Input } from '@/components/ui/input';
 * import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 * import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 * import { Alert, AlertDescription } from '@/components/ui/alert';
 * import { Skeleton } from '@/components/ui/skeleton';
 * import { toast } from 'sonner';
 * import axiosInstance from '@/http/axios';
 * import useSessionStore from '@/store/session';
 * import { [Icons] } from 'lucide-react';
 */ 