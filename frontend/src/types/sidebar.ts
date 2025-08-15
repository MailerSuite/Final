export interface SidebarBadge {
  label?: string
  count: string | number
}

export interface SidebarItem {
  label: string
  icon: any
  url?: string
  badge?: string | number
  badges?: SidebarBadge[]
  tourId?: string
  nestedItem?: {
    label: string
    url: string
    icon?: any
    tourId?: string
    badge?: string | number
  }[]
}

export interface SidebarSection {
  section: string
  items: SidebarItem[]
  badge?: string
  disabled?: boolean
}

export interface SessionData {
  label: string
  value: number | string
  status?: "active" | "inactive" | "error"
}
