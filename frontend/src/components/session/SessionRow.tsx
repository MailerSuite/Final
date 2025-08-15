import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useDeleteSession } from '@/api/sessions'
import type { Session } from '@/types/session'

interface Props {
  session: Session
  isCurrent?: boolean
}

export default function SessionRow({ session, isCurrent = false }: Props) {
  const { mutate, isLoading } = useDeleteSession()
  const [open, setOpen] = useState(false)

  const handleDelete = () => {
    mutate(session.id)
    setOpen(false)
  }

  return (
    <tr>
      <td className="py-2">
        <div className="flex items-center gap-2">
          <span>{session.name}</span>
          {isCurrent && (
            <Badge variant="secondary" aria-label="Current session" className="px-2 py-0.5">Current</Badge>
          )}
        </div>
      </td>
      <td className="text-right">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Logout session on ${session.name}`}
            >
              <Icon name="Trash2" size="sm" className="text-destructive" ariaLabel="Delete session" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Logout session?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to logout "{session.name}"?
            </p>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                Logout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </td>
    </tr>
  )
}
