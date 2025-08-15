/**
 * Routing Debug Utilities
 * Helper functions to diagnose and resolve routing issues
 */

const STORAGE_KEY = 'sgpt_last_route';

export interface RoutingDiagnostics {
  currentPath: string;
  savedRoute: string | null;
  navigationHistory: string[];
  potentialIssues: string[];
  recommendations: string[];
}

/**
 * Get comprehensive routing diagnostics
 */
export function getRoutingDiagnostics(): RoutingDiagnostics {
  const currentPath = window.location.pathname;
  const savedRoute = localStorage.getItem(STORAGE_KEY);
  const navigationHistory = getNavigationHistory();
  
  const potentialIssues: string[] = [];
  const recommendations: string[] = [];
  
  // Check for common issues
  if (savedRoute === '/404') {
    potentialIssues.push('404 route is saved as last route');
    recommendations.push('Clear saved route to break navigation loop');
  }
  
  if (savedRoute?.startsWith('/auth')) {
    potentialIssues.push('Auth route is saved as last route');
    recommendations.push('Auth routes should not be persisted');
  }
  
  if (currentPath === '/404') {
    potentialIssues.push('Currently on 404 page');
    recommendations.push('Check if the intended route exists');
  }
  
  // Check for navigation loops
  const pathCounts = navigationHistory.reduce((acc, path) => {
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(pathCounts).forEach(([path, count]) => {
    if (count >= 3) {
      potentialIssues.push(`Navigation loop detected: ${path} visited ${count} times`);
      recommendations.push(`Clear navigation history and saved routes`);
    }
  });
  
  return {
    currentPath,
    savedRoute,
    navigationHistory,
    potentialIssues,
    recommendations
  };
}

/**
 * Clear all routing data to resolve issues
 */
export function clearAllRoutingData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('sgpt_navigation_history');
  console.log('🧹 Cleared all routing data');
}

/**
 * Force navigate to a safe route
 */
export function forceNavigateToSafe(): void {
  clearAllRoutingData();
  window.location.href = '/';
}

/**
 * Get navigation history (mock implementation)
 */
function getNavigationHistory(): string[] {
  try {
    const history = localStorage.getItem('sgpt_navigation_history');
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

/**
 * Log current routing state for debugging
 */
export function debugCurrentRoute(): void {
  const diagnostics = getRoutingDiagnostics();
  
  console.group('🔍 Routing Diagnostics');
  console.log('Current Path:', diagnostics.currentPath);
  console.log('Saved Route:', diagnostics.savedRoute);
  console.log('Navigation History:', diagnostics.navigationHistory);
  
  if (diagnostics.potentialIssues.length > 0) {
    console.warn('Potential Issues:', diagnostics.potentialIssues);
    console.info('Recommendations:', diagnostics.recommendations);
  } else {
    console.log('✅ No routing issues detected');
  }
  
  console.groupEnd();
}

// Expose debug functions globally in development
if (import.meta.env.DEV) {
  (window as any).routingDebug = {
    getDiagnostics: getRoutingDiagnostics,
    clearAll: clearAllRoutingData,
    forceNavigate: forceNavigateToSafe,
    debug: debugCurrentRoute
  };
} 