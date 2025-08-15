import React from 'react'
import { useWorkspace } from '@/context/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function WorkspaceTestPage() {
  const {
    workspaces,
    activeWorkspace,
    isLoading,
    error,
    setActiveWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    refreshWorkspaces
  } = useWorkspace()

  const [newWorkspaceName, setNewWorkspaceName] = React.useState('')
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState('')

  const handleCreate = async () => {
    if (!newWorkspaceName.trim()) return
    try {
      await createWorkspace(newWorkspaceName.trim())
      setNewWorkspaceName('')
    } catch (err) {
      console.error('Failed to create workspace:', err)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    try {
      await updateWorkspace(id, { name: editName.trim() })
      setEditingId(null)
      setEditName('')
    } catch (err) {
      console.error('Failed to update workspace:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (workspaces.length <= 1) {
      alert('Cannot delete the last workspace')
      return
    }
    
    if (confirm('Are you sure you want to delete this workspace?')) {
      try {
        await deleteWorkspace(id)
      } catch (err) {
        console.error('Failed to delete workspace:', err)
      }
    }
  }

  const startEditing = (workspace: any) => {
    setEditingId(workspace.id)
    setEditName(workspace.name)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading workspaces...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workspace Test Page</h1>
          <p className="text-muted-foreground">Test and manage your workspaces</p>
        </div>
        <Button onClick={refreshWorkspaces} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Active Workspace */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Active Workspace
          </CardTitle>
          <CardDescription>
            Currently selected workspace for this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeWorkspace ? (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-semibold">{activeWorkspace.name}</h3>
                <p className="text-sm text-muted-foreground">
                  ID: {activeWorkspace.id}
                </p>
                {activeWorkspace.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeWorkspace.description}
                  </p>
                )}
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No active workspace</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Workspace */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Workspace</CardTitle>
          <CardDescription>
            Add a new workspace to organize your work
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="new-workspace" className="sr-only">
                Workspace Name
              </Label>
              <Input
                id="new-workspace"
                placeholder="Enter workspace name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                }}
              />
            </div>
            <Button onClick={handleCreate} disabled={!newWorkspaceName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workspaces List */}
      <Card>
        <CardHeader>
          <CardTitle>All Workspaces</CardTitle>
          <CardDescription>
            Manage your workspaces ({workspaces.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Briefcase className={cn(
                    "h-4 w-4 flex-shrink-0",
                    workspace.is_active ? "text-primary" : "text-muted-foreground"
                  )} />
                  
                  {editingId === workspace.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate(workspace.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="flex-1 max-w-xs"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(workspace.id)}
                        disabled={!editName.trim()}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-medium truncate",
                        workspace.is_active && "text-primary"
                      )}>
                        {workspace.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Created: {workspace.created_at ? new Date(workspace.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {workspace.is_active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveWorkspace(workspace)}
                    >
                      Activate
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(workspace)}
                    disabled={editingId !== null}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  
                  {workspaces.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(workspace.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {workspaces.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No workspaces found</p>
              <p className="text-sm">Create your first workspace to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>
            Technical details for debugging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <div>Total Workspaces: {workspaces.length}</div>
            <div>Active Workspace ID: {activeWorkspace?.id || 'None'}</div>
            <div>Loading State: {isLoading.toString()}</div>
            <div>Error State: {error || 'None'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
