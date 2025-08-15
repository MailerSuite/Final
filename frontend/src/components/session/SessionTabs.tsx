import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import useSessionStore from '@/store/session'
import CreateSessionModal from './CreateSessionModal'
import { Button } from '@/components/ui/button'
import DeleteSessionConfirm from './DeleteSessionConfirm'

export default function SessionTabs() {
  const {
    sessions,
    session,
    setSession,
    addSession,
    getSessions,
    removeSession,
  } = useSessionStore()

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    getSessions()
  }, [getSessions])

  const handleCreate = async (name: string) => {
    await addSession(name)
    setCreateOpen(false)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    await removeSession(deleteId)
    setDeleteId(null)
  }

  const existingNames = sessions ? sessions.map((s) => s.name) : []

  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {sessions?.map((s) => (
        <div key={s.id} className="relative group flex-shrink-0">
          <Button
            size="sm"
            variant={session?.id === s.id ? 'default' : 'outline'}
            className="px-3 py-1 text-xs"
            onClick={() => {
              if (session?.id !== s.id) {
                setSession(s)
              }
            }}
          >
            {s.name}
          </Button>
          {sessions.length > 1 && (
            <button
              onClick={() => setDeleteId(s.id)}
              className="absolute -top-2 -right-2 rounded-full bg-background text-muted-foreground hover:text-destructive"
            >
              <Icon name="Trash" size="xs" className="text-destructive" ariaLabel="Delete session" />
            </button>
          )}
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setCreateOpen(true)}
        className="flex-shrink-0"
      >
        <Icon name="Plus" size="sm" ariaLabel="Create new session" />
      </Button>

      <CreateSessionModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
        existingNames={existingNames}
      />

      <DeleteSessionConfirm
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
