import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import {
  ChevronDown,
  Plus,
  Settings,
  Trash2,
  Edit,
  Check,
  Loader2,
  Briefcase,
  Sparkles,
} from 'lucide-react'
import { useWorkspace, Workspace } from '@/context/WorkspaceContext'

interface WorkspaceSelectorProps {
  className?: string
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ className }) => {
  const { 
    workspaces, 
    activeWorkspace, 
    isLoading, 
    setActiveWorkspace, 
    createWorkspace, 
    updateWorkspace, 
    deleteWorkspace 
  } = useWorkspace()
  
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [editWorkspaceName, setEditWorkspaceName] = useState('')

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return
    
    try {
      await createWorkspace(newWorkspaceName.trim())
      setNewWorkspaceName('')
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to create workspace:', error)
    }
  }

  const handleUpdateWorkspace = async (id: string) => {
    if (!editWorkspaceName.trim()) return
    
    try {
      await updateWorkspace(id, { name: editWorkspaceName.trim() })
      setEditWorkspaceName('')
      setIsEditing(null)
    } catch (error) {
      console.error('Failed to update workspace:', error)
    }
  }

  const handleDeleteWorkspace = async (id: string) => {
    if (workspaces.length <= 1) {
      alert('Cannot delete the last workspace')
      return
    }
    
    if (confirm('Are you sure you want to delete this workspace?')) {
      try {
        await deleteWorkspace(id)
      } catch (error) {
        console.error('Failed to delete workspace:', error)
      }
    }
  }

  const handleWorkspaceSelect = async (workspace: Workspace) => {
    if (workspace.id !== activeWorkspace?.id) {
      await setActiveWorkspace(workspace)
    }
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-8 px-3 gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
            "border border-border/50 hover:border-border",
            className
          )}
        >
          <Briefcase className="h-4 w-4" />
          <span className="text-sm font-medium truncate max-w-32">
            {activeWorkspace?.name || 'Select Workspace'}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-80 bg-background/95 backdrop-blur-xl border-border">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Workspaces</span>
          <Badge variant="secondary" className="text-xs">
            {workspaces.length}
          </Badge>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Create New Workspace */}
        {isCreating ? (
          <div className="p-2 space-y-2">
            <Input
              placeholder="Workspace name"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateWorkspace()
                if (e.key === 'Escape') setIsCreating(false)
              }}
              className="h-8 text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreateWorkspace}
                disabled={!newWorkspaceName.trim()}
                className="flex-1 h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <DropdownMenuItem
            onClick={() => setIsCreating(true)}
            className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Workspace
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Workspace List */}
        <DropdownMenuGroup>
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="relative">
              {isEditing === workspace.id ? (
                <div className="p-2 space-y-2">
                  <Input
                    placeholder="Workspace name"
                    value={editWorkspaceName}
                    onChange={(e) => setEditWorkspaceName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateWorkspace(workspace.id)
                      if (e.key === 'Escape') setIsEditing(null)
                    }}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateWorkspace(workspace.id)}
                      disabled={!editWorkspaceName.trim()}
                      className="flex-1 h-7 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(null)}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <DropdownMenuItem
                  onClick={() => handleWorkspaceSelect(workspace)}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 focus:bg-muted/50",
                    "flex items-center justify-between group"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Briefcase className={cn(
                      "h-4 w-4 flex-shrink-0",
                      workspace.is_active ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm truncate flex-1",
                      workspace.is_active ? "font-medium" : ""
                    )}>
                      {workspace.name}
                    </span>
                    {workspace.is_active && (
                      <Badge variant="default" className="text-xs bg-primary/20 text-primary border-primary/30">
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditWorkspaceName(workspace.name)
                        setIsEditing(workspace.id)
                      }}
                      className="h-6 w-6 p-0 hover:bg-muted/50"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    {workspaces.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteWorkspace(workspace.id)
                        }}
                        className="h-6 w-6 p-0 hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </DropdownMenuItem>
              )}
            </div>
          ))}
        </DropdownMenuGroup>
        
        {workspaces.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No workspaces found</p>
            <p className="text-xs">Create your first workspace to get started</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
