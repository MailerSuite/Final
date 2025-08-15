import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { IUser } from '@/types'

// ============================
// UNIFIED STATE MANAGEMENT SYSTEM
// Single Zustand store replacing all Redux/Context patterns
// ============================

// State Types
export interface AuthState {
  // Authentication data
  token: string | null
  refreshToken: string | null
  user: IUser | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Login attempt tracking
  loginAttempts: number
  lastLoginAttempt: Date | null
  
  // Permission cache
  permissions: Set<string>
  roles: string[]
}

export interface SessionState {
  // Current session
  currentSession: {
    id: string | null
    name: string | null
    createdAt: Date | null
  }
  
  // Available sessions
  sessions: Array<{
    id: string
    name: string
    createdAt: Date
    isActive: boolean
  }>
  
  // Session loading states
  isLoadingSessions: boolean
  isCreatingSession: boolean
  
  // Active proxy
  activeProxy: {
    id: string | null
    name: string | null
    host: string | null
    port: number | null
  } | null
}

export interface UIState {
  // Theme and appearance
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  
  // Loading states
  globalLoading: boolean
  loadingStates: Record<string, boolean>
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: Date
    read: boolean
  }>
  
  // Modal states
  modals: Record<string, boolean>
  
  // Page states
  currentPage: string
  pageData: Record<string, any>
}

export interface CampaignState {
  // Campaign draft
  draft: {
    name: string
    templateIds: string[]
    senders: string[]
    sender: string
    cc: string[]
    bcc: string[]
    messageType: 'html' | 'text'
    xHeaders: Array<{ key: string; value: string }>
    smtpAccounts: string[]
    proxies: string[]
    retries: number
    timeout: number
    batchSize: number
    delaySeconds: number
    leadDatabases: string[]
  }
  
  // Campaign list
  campaigns: Array<{
    id: string
    name: string
    status: string
    createdAt: Date
    stats: {
      sent: number
      delivered: number
      opened: number
      clicked: number
    }
  }>
  
  // Loading states
  isLoadingCampaigns: boolean
  isCreatingCampaign: boolean
  isSavingDraft: boolean
}

export interface ResourceState {
  // SMTP accounts
  smtpAccounts: Array<{
    id: string
    email: string
    host: string
    port: number
    isActive: boolean
  }>
  
  // Proxy servers
  proxyServers: Array<{
    id: string
    host: string
    port: number
    type: string
    isActive: boolean
  }>
  
  // Email templates
  templates: Array<{
    id: string
    name: string
    subject: string
    content: string
    createdAt: Date
  }>
  
  // Lead databases
  leadDatabases: Array<{
    id: string
    name: string
    count: number
    createdAt: Date
  }>
  
  // Counts and stats
  counts: {
    smtp: number
    proxies: number
    templates: number
    leads: number
    campaigns: number
  }
}

// Combined App State
export interface AppState {
  auth: AuthState
  session: SessionState
  ui: UIState
  campaign: CampaignState
  resources: ResourceState
}

// Action Types
export interface AuthActions {
  // Authentication actions
  setToken: (token: string | null) => void
  setRefreshToken: (refreshToken: string | null) => void
  setUser: (user: IUser | null) => void
  setIsLoading: (loading: boolean) => void
  
  // Login attempt tracking
  incrementLoginAttempts: () => void
  resetLoginAttempts: () => void
  isAccountLocked: () => boolean
  
  // Permission management
  setPermissions: (permissions: string[]) => void
  addPermission: (permission: string) => void
  hasPermission: (permission: string) => boolean
  setRoles: (roles: string[]) => void
  
  // Auth flow actions
  login: (identifier: string, password: string, fingerprint: string) => Promise<void>
  logout: () => void
  refreshTokens: () => Promise<void>
}

export interface SessionActions {
  // Session management
  setCurrentSession: (session: { id: string; name: string }) => void
  setSessions: (sessions: Array<unknown>) => void
  addSession: (name: string) => Promise<void>
  removeSession: (id: string) => Promise<void>
  setIsLoadingSessions: (loading: boolean) => void
  
  // Proxy management
  setActiveProxy: (proxy: unknown) => void
  loadActiveProxy: (sessionId: string) => Promise<void>
  updateActiveProxy: (sessionId: string, proxyId: string) => Promise<void>
}

export interface UIActions {
  // Theme and appearance
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // Loading states
  setGlobalLoading: (loading: boolean) => void
  setLoadingState: (key: string, loading: boolean) => void
  clearLoadingStates: () => void
  
  // Notifications
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void
  removeNotification: (id: string) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  
  // Modals
  openModal: (modalId: string) => void
  closeModal: (modalId: string) => void
  toggleModal: (modalId: string) => void
  
  // Page state
  setCurrentPage: (page: string, data?: any) => void
  setPageData: (page: string, data: unknown) => void
}

export interface CampaignActions {
  // Draft management
  updateDraft: (updates: Partial<CampaignState['draft']>) => void
  clearDraft: () => void
  saveDraft: () => Promise<void>
  loadDraft: () => Promise<void>
  
  // Campaign management
  setCampaigns: (campaigns: Array<unknown>) => void
  addCampaign: (campaign: unknown) => void
  updateCampaign: (id: string, updates: unknown) => void
  removeCampaign: (id: string) => void
  
  // Loading states
  setIsLoadingCampaigns: (loading: boolean) => void
  setIsCreatingCampaign: (loading: boolean) => void
}

export interface ResourceActions {
  // SMTP accounts
  setSmtpAccounts: (accounts: Array<unknown>) => void
  addSmtpAccount: (account: unknown) => void
  updateSmtpAccount: (id: string, updates: unknown) => void
  removeSmtpAccount: (id: string) => void
  
  // Proxy servers
  setProxyServers: (proxies: Array<unknown>) => void
  addProxyServer: (proxy: unknown) => void
  updateProxyServer: (id: string, updates: unknown) => void
  removeProxyServer: (id: string) => void
  
  // Templates
  setTemplates: (templates: Array<unknown>) => void
  addTemplate: (template: unknown) => void
  updateTemplate: (id: string, updates: unknown) => void
  removeTemplate: (id: string) => void
  
  // Lead databases
  setLeadDatabases: (databases: Array<unknown>) => void
  addLeadDatabase: (database: unknown) => void
  updateLeadDatabase: (id: string, updates: unknown) => void
  removeLeadDatabase: (id: string) => void
  
  // Counts
  setCounts: (counts: Partial<ResourceState['counts']>) => void
  refreshCounts: () => Promise<void>
}

// Store Type
export type UnifiedStore = AppState & AuthActions & SessionActions & UIActions & CampaignActions & ResourceActions

// Default State
const defaultAuthState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  loginAttempts: 0,
  lastLoginAttempt: null,
  permissions: new Set(),
  roles: []
}

const defaultSessionState: SessionState = {
  currentSession: {
    id: null,
    name: null,
    createdAt: null
  },
  sessions: [],
  isLoadingSessions: false,
  isCreatingSession: false,
  activeProxy: null
}

const defaultUIState: UIState = {
  theme: 'system',
  sidebarCollapsed: false,
  globalLoading: false,
  loadingStates: {},
  notifications: [],
  modals: {},
  currentPage: '/',
  pageData: {}
}

const defaultCampaignState: CampaignState = {
  draft: {
    name: '',
    templateIds: [],
    senders: [],
    sender: '',
    cc: [],
    bcc: [],
    messageType: 'html',
    xHeaders: [],
    smtpAccounts: [],
    proxies: [],
    retries: 3,
    timeout: 10000,
    batchSize: 100,
    delaySeconds: 0,
    leadDatabases: []
  },
  campaigns: [],
  isLoadingCampaigns: false,
  isCreatingCampaign: false,
  isSavingDraft: false
}

const defaultResourceState: ResourceState = {
  smtpAccounts: [],
  proxyServers: [],
  templates: [],
  leadDatabases: [],
  counts: {
    smtp: 0,
    proxies: 0,
    templates: 0,
    leads: 0,
    campaigns: 0
  }
}

// Create Unified Store
export const useUnifiedStore = create<UnifiedStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        auth: defaultAuthState,
        session: defaultSessionState,
        ui: defaultUIState,
        campaign: defaultCampaignState,
        resources: defaultResourceState,

        // Auth Actions
        setToken: (token) => set((state) => {
          state.auth.token = token
          state.auth.isAuthenticated = !!token
        }),

        setRefreshToken: (refreshToken) => set((state) => {
          state.auth.refreshToken = refreshToken
        }),

        setUser: (user) => set((state) => {
          state.auth.user = user
        }),

        setIsLoading: (loading) => set((state) => {
          state.auth.isLoading = loading
        }),

        incrementLoginAttempts: () => set((state) => {
          state.auth.loginAttempts += 1
          state.auth.lastLoginAttempt = new Date()
        }),

        resetLoginAttempts: () => set((state) => {
          state.auth.loginAttempts = 0
          state.auth.lastLoginAttempt = null
        }),

        isAccountLocked: () => {
          const { loginAttempts, lastLoginAttempt } = get().auth
          if (loginAttempts >= 5 && lastLoginAttempt) {
            const lockoutTime = 15 * 60 * 1000 // 15 minutes
            const timeSinceLastAttempt = Date.now() - lastLoginAttempt.getTime()
            return timeSinceLastAttempt < lockoutTime
          }
          return false
        },

        setPermissions: (permissions) => set((state) => {
          state.auth.permissions = new Set(permissions)
        }),

        addPermission: (permission) => set((state) => {
          state.auth.permissions.add(permission)
        }),

        hasPermission: (permission) => {
          return get().auth.permissions.has(permission)
        },

        setRoles: (roles) => set((state) => {
          state.auth.roles = roles
        }),

        login: async (identifier, password, fingerprint) => {
          set((state) => {
            state.auth.isLoading = true
          })

          try {
            // Login implementation would go here
            // This would use the unified API client
            
            // For now, just reset loading state
            set((state) => {
              state.auth.isLoading = false
            })
          } catch (error) {
            set((state) => {
              state.auth.isLoading = false
            })
            throw error
          }
        },

        logout: () => set((state) => {
          state.auth = { ...defaultAuthState }
        }),

        refreshTokens: async () => {
          // Token refresh implementation
        },

        // Session Actions
        setCurrentSession: (session) => set((state) => {
          state.session.currentSession = {
            id: session.id,
            name: session.name,
            createdAt: new Date()
          }
        }),

        setSessions: (sessions) => set((state) => {
          state.session.sessions = sessions
        }),

        addSession: async (name) => {
          set((state) => {
            state.session.isCreatingSession = true
          })

          try {
            // Implementation would go here
            set((state) => {
              state.session.isCreatingSession = false
            })
          } catch (error) {
            set((state) => {
              state.session.isCreatingSession = false
            })
            throw error
          }
        },

        removeSession: async (id) => {
          // Implementation here
        },

        setIsLoadingSessions: (loading) => set((state) => {
          state.session.isLoadingSessions = loading
        }),

        setActiveProxy: (proxy) => set((state) => {
          state.session.activeProxy = proxy
        }),

        loadActiveProxy: async (sessionId) => {
          // Implementation here
        },

        updateActiveProxy: async (sessionId, proxyId) => {
          // Implementation here
        },

        // UI Actions
        setTheme: (theme) => set((state) => {
          state.ui.theme = theme
        }),

        toggleSidebar: () => set((state) => {
          state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed
        }),

        setSidebarCollapsed: (collapsed) => set((state) => {
          state.ui.sidebarCollapsed = collapsed
        }),

        setGlobalLoading: (loading) => set((state) => {
          state.ui.globalLoading = loading
        }),

        setLoadingState: (key, loading) => set((state) => {
          if (loading) {
            state.ui.loadingStates[key] = true
          } else {
            delete state.ui.loadingStates[key]
          }
        }),

        clearLoadingStates: () => set((state) => {
          state.ui.loadingStates = {}
        }),

        addNotification: (notification) => set((state) => {
          const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          state.ui.notifications.push({
            ...notification,
            id,
            timestamp: new Date(),
            read: false
          })
        }),

        removeNotification: (id) => set((state) => {
          state.ui.notifications = state.ui.notifications.filter(n => n.id !== id)
        }),

        markNotificationRead: (id) => set((state) => {
          const notification = state.ui.notifications.find(n => n.id === id)
          if (notification) {
            notification.read = true
          }
        }),

        clearNotifications: () => set((state) => {
          state.ui.notifications = []
        }),

        openModal: (modalId) => set((state) => {
          state.ui.modals[modalId] = true
        }),

        closeModal: (modalId) => set((state) => {
          state.ui.modals[modalId] = false
        }),

        toggleModal: (modalId) => set((state) => {
          state.ui.modals[modalId] = !state.ui.modals[modalId]
        }),

        setCurrentPage: (page, data) => set((state) => {
          state.ui.currentPage = page
          if (data) {
            state.ui.pageData[page] = data
          }
        }),

        setPageData: (page, data) => set((state) => {
          state.ui.pageData[page] = data
        }),

        // Campaign Actions
        updateDraft: (updates) => set((state) => {
          Object.assign(state.campaign.draft, updates)
        }),

        clearDraft: () => set((state) => {
          state.campaign.draft = { ...defaultCampaignState.draft }
        }),

        saveDraft: async () => {
          set((state) => {
            state.campaign.isSavingDraft = true
          })

          try {
            // Implementation here
            set((state) => {
              state.campaign.isSavingDraft = false
            })
          } catch (error) {
            set((state) => {
              state.campaign.isSavingDraft = false
            })
            throw error
          }
        },

        loadDraft: async () => {
          // Implementation here
        },

        setCampaigns: (campaigns) => set((state) => {
          state.campaign.campaigns = campaigns
        }),

        addCampaign: (campaign) => set((state) => {
          state.campaign.campaigns.push(campaign)
        }),

        updateCampaign: (id, updates) => set((state) => {
          const campaign = state.campaign.campaigns.find(c => c.id === id)
          if (campaign) {
            Object.assign(campaign, updates)
          }
        }),

        removeCampaign: (id) => set((state) => {
          state.campaign.campaigns = state.campaign.campaigns.filter(c => c.id !== id)
        }),

        setIsLoadingCampaigns: (loading) => set((state) => {
          state.campaign.isLoadingCampaigns = loading
        }),

        setIsCreatingCampaign: (loading) => set((state) => {
          state.campaign.isCreatingCampaign = loading
        }),

        // Resource Actions
        setSmtpAccounts: (accounts) => set((state) => {
          state.resources.smtpAccounts = accounts
        }),

        addSmtpAccount: (account) => set((state) => {
          state.resources.smtpAccounts.push(account)
        }),

        updateSmtpAccount: (id, updates) => set((state) => {
          const account = state.resources.smtpAccounts.find(a => a.id === id)
          if (account) {
            Object.assign(account, updates)
          }
        }),

        removeSmtpAccount: (id) => set((state) => {
          state.resources.smtpAccounts = state.resources.smtpAccounts.filter(a => a.id !== id)
        }),

        setProxyServers: (proxies) => set((state) => {
          state.resources.proxyServers = proxies
        }),

        addProxyServer: (proxy) => set((state) => {
          state.resources.proxyServers.push(proxy)
        }),

        updateProxyServer: (id, updates) => set((state) => {
          const proxy = state.resources.proxyServers.find(p => p.id === id)
          if (proxy) {
            Object.assign(proxy, updates)
          }
        }),

        removeProxyServer: (id) => set((state) => {
          state.resources.proxyServers = state.resources.proxyServers.filter(p => p.id !== id)
        }),

        setTemplates: (templates) => set((state) => {
          state.resources.templates = templates
        }),

        addTemplate: (template) => set((state) => {
          state.resources.templates.push(template)
        }),

        updateTemplate: (id, updates) => set((state) => {
          const template = state.resources.templates.find(t => t.id === id)
          if (template) {
            Object.assign(template, updates)
          }
        }),

        removeTemplate: (id) => set((state) => {
          state.resources.templates = state.resources.templates.filter(t => t.id !== id)
        }),

        setLeadDatabases: (databases) => set((state) => {
          state.resources.leadDatabases = databases
        }),

        addLeadDatabase: (database) => set((state) => {
          state.resources.leadDatabases.push(database)
        }),

        updateLeadDatabase: (id, updates) => set((state) => {
          const database = state.resources.leadDatabases.find(d => d.id === id)
          if (database) {
            Object.assign(database, updates)
          }
        }),

        removeLeadDatabase: (id) => set((state) => {
          state.resources.leadDatabases = state.resources.leadDatabases.filter(d => d.id !== id)
        }),

        setCounts: (counts) => set((state) => {
          Object.assign(state.resources.counts, counts)
        }),

        refreshCounts: async () => {
          // Implementation here
        }
      })),
      {
        name: 'sgpt-unified-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist certain parts of the state
          auth: {
            token: state.auth.token,
            refreshToken: state.auth.refreshToken,
            user: state.auth.user,
            permissions: Array.from(state.auth.permissions),
            roles: state.auth.roles
          },
          ui: {
            theme: state.ui.theme,
            sidebarCollapsed: state.ui.sidebarCollapsed
          },
          campaign: {
            draft: state.campaign.draft
          }
        }),
        version: 1
      }
    ),
    {
      name: 'sgpt-store'
    }
  )
)

// Selector hooks for better performance
export const useAuth = () => useUnifiedStore((state) => state.auth)
export const useAuthActions = () => useUnifiedStore((state) => ({
  setToken: state.setToken,
  setUser: state.setUser,
  login: state.login,
  logout: state.logout,
  setIsLoading: state.setIsLoading,
  incrementLoginAttempts: state.incrementLoginAttempts,
  resetLoginAttempts: state.resetLoginAttempts,
  isAccountLocked: state.isAccountLocked,
  hasPermission: state.hasPermission
}))

export const useSession = () => useUnifiedStore((state) => state.session)
export const useSessionActions = () => useUnifiedStore((state) => ({
  setCurrentSession: state.setCurrentSession,
  setSessions: state.setSessions,
  addSession: state.addSession,
  removeSession: state.removeSession,
  setActiveProxy: state.setActiveProxy
}))

export const useUI = () => useUnifiedStore((state) => state.ui)
export const useUIActions = () => useUnifiedStore((state) => ({
  setTheme: state.setTheme,
  toggleSidebar: state.toggleSidebar,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  openModal: state.openModal,
  closeModal: state.closeModal,
  setGlobalLoading: state.setGlobalLoading,
  setLoadingState: state.setLoadingState
}))

export const useCampaign = () => useUnifiedStore((state) => state.campaign)
export const useCampaignActions = () => useUnifiedStore((state) => ({
  updateDraft: state.updateDraft,
  clearDraft: state.clearDraft,
  setCampaigns: state.setCampaigns,
  addCampaign: state.addCampaign,
  updateCampaign: state.updateCampaign
}))

export const useResources = () => useUnifiedStore((state) => state.resources)
export const useResourceActions = () => useUnifiedStore((state) => ({
  setSmtpAccounts: state.setSmtpAccounts,
  setProxyServers: state.setProxyServers,
  setTemplates: state.setTemplates,
  setLeadDatabases: state.setLeadDatabases,
  setCounts: state.setCounts,
  refreshCounts: state.refreshCounts
})) 