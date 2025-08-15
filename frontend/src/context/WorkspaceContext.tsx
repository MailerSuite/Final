import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

export interface Workspace {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface WorkspaceContextType {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  isLoading: boolean
  error: string | null
  setActiveWorkspace: (workspace: Workspace) => Promise<void>
  createWorkspace: (name: string, description?: string) => Promise<Workspace>
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<Workspace>
  deleteWorkspace: (id: string) => Promise<void>
  refreshWorkspaces: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return context
}

interface WorkspaceProviderProps {
  children: ReactNode
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // In dev mode, use mock data to avoid API calls
      if (import.meta.env.DEV) {
        console.log('🚀 Dev mode: Using mock workspace data');
        const mockWorkspace: Workspace = {
          id: 'dev-workspace',
          name: 'Development Workspace',
          description: 'Local development environment',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setWorkspaces([mockWorkspace]);
        setActiveWorkspaceState(mockWorkspace);
        localStorage.setItem('activeWorkspaceId', mockWorkspace.id);
        setIsLoading(false);
        return;
      }
      
      // Try to get workspaces from bootstrap endpoint first
      const bootstrapResponse = await axios.get('/api/v1/bootstrap?include=workspaces')
      if (bootstrapResponse.data.workspaces) {
        const { items, activeWorkspaceId } = bootstrapResponse.data.workspaces
        setWorkspaces(items || [])
        
        // Set active workspace
        const active = items?.find((w: Workspace) => w.id === activeWorkspaceId) || items?.[0] || null
        setActiveWorkspaceState(active)
        
        // Store in localStorage for persistence
        if (active) {
          localStorage.setItem('activeWorkspaceId', active.id)
        }
      } else {
        // Fallback to direct workspaces endpoint
        const response = await axios.get('/api/v1/workspaces')
        setWorkspaces(response.data.items || [])
        
        // Find active workspace
        const active = response.data.items?.find((w: Workspace) => w.is_active) || response.data.items?.[0] || null
        setActiveWorkspaceState(active)
        
        if (active) {
          localStorage.setItem('activeWorkspaceId', active.id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err)
      setError('Failed to load workspaces')
    } finally {
      setIsLoading(false)
    }
  }

  const setActiveWorkspace = async (workspace: Workspace) => {
    try {
      setError(null)
      
      // Activate workspace on backend
      await axios.post(`/api/v1/workspaces/${workspace.id}/activate`)
      
      // Update local state
      setWorkspaces(prev => 
        prev.map(w => ({ ...w, is_active: w.id === workspace.id }))
      )
      setActiveWorkspaceState(workspace)
      
      // Store in localStorage
      localStorage.setItem('activeWorkspaceId', workspace.id)
      
      // Refresh workspaces to get updated state
      await fetchWorkspaces()
    } catch (err) {
      console.error('Failed to activate workspace:', err)
      setError('Failed to activate workspace')
    }
  }

  const createWorkspace = async (name: string, description?: string): Promise<Workspace> => {
    try {
      setError(null)
      const response = await axios.post('/api/v1/workspaces', { name, description })
      const newWorkspace = response.data
      
      setWorkspaces(prev => [newWorkspace, ...prev])
      return newWorkspace
    } catch (err) {
      console.error('Failed to create workspace:', err)
      setError('Failed to create workspace')
      throw err
    }
  }

  const updateWorkspace = async (id: string, updates: Partial<Workspace>): Promise<Workspace> => {
    try {
      setError(null)
      const response = await axios.put(`/api/v1/workspaces/${id}`, updates)
      const updatedWorkspace = response.data
      
      setWorkspaces(prev => 
        prev.map(w => w.id === id ? updatedWorkspace : w)
      )
      
      if (activeWorkspace?.id === id) {
        setActiveWorkspaceState(updatedWorkspace)
      }
      
      return updatedWorkspace
    } catch (err) {
      console.error('Failed to update workspace:', err)
      setError('Failed to update workspace')
      throw err
    }
  }

  const deleteWorkspace = async (id: string) => {
    try {
      setError(null)
      await axios.delete(`/api/v1/workspaces/${id}`)
      
      setWorkspaces(prev => prev.filter(w => w.id !== id))
      
      // If deleted workspace was active, switch to first available
      if (activeWorkspace?.id === id) {
        const remaining = workspaces.filter(w => w.id !== id)
        if (remaining.length > 0) {
          await setActiveWorkspace(remaining[0])
        } else {
          setActiveWorkspaceState(null)
          localStorage.removeItem('activeWorkspaceId')
        }
      }
    } catch (err) {
      console.error('Failed to delete workspace:', err)
      setError('Failed to delete workspace')
      throw err
    }
  }

  const refreshWorkspaces = async () => {
    await fetchWorkspaces()
  }

  // Load workspaces on mount
  useEffect(() => {
    fetchWorkspaces()
  }, [])

  // Restore active workspace from localStorage on mount
  useEffect(() => {
    const savedWorkspaceId = localStorage.getItem('activeWorkspaceId')
    if (savedWorkspaceId && workspaces.length > 0) {
      const saved = workspaces.find(w => w.id === savedWorkspaceId)
      if (saved && !saved.is_active) {
        setActiveWorkspace(saved)
      }
    }
  }, [workspaces])

  const value: WorkspaceContextType = {
    workspaces,
    activeWorkspace,
    isLoading,
    error,
    setActiveWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    refreshWorkspaces,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}
