// Automatically generated sidebar data for AppSidebar
import { Shield, Users, BarChart3, Activity } from 'lucide-react';

interface SidebarItem {
  label: string;
  url: string;
  icon: any;
  badge?: number | string;
}

interface SidebarSection {
  section: string;
  items: SidebarItem[];
}

export function getSidebarSections(counts?: Record<string, number>) : SidebarSection[] {
  // Return sections compatible with AppSidebar structure
  return [
    {
      section: 'Admin',
      items: [
        { label: 'Admin Dashboard', url: '/admin', icon: Shield },
        { label: 'User Management', url: '/admin/users', icon: Users },
      ],
    },
    {
      section: 'Dashboard',
      items: [
        { label: 'Sessions', url: '/sessions', icon: Activity, badge: counts?.sessions || 0 },
        { label: 'Analytics', url: '/analytics', icon: BarChart3 },
      ],
    },
  ];
}
