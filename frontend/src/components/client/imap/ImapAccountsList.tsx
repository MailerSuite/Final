import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Loader from '@/components/common/Loader'
import ErrorAlert from '@/components/common/ErrorAlert'
import ImapAccountForm from './ImapAccountForm'
import { useImapAccounts } from '@/hooks/useImapAccounts'

interface Props {
  sessionId: string
  onSelect?: (id: string) => void
}

export default function ImapAccountsList({ sessionId, onSelect }: Props) {
  const { listQuery, create, update, remove, test } = useImapAccounts(sessionId)
  const [editingId, setEditingId] = useState<string | null>(null)

  if (listQuery.isLoading) return <Loader />
  if (listQuery.error) return <ErrorAlert message="Failed to load accounts" />

  return (
    <div className="space-y-4">
      {editingId ? (
        <ImapAccountForm
          initial={listQuery.data?.find((a: any) => a.id === editingId)}
                      onSubmit={(d) => { update.mutate({ id: editingId, data: d }); setEditingId(null); }}
          onCancel={() => setEditingId(null)}
          loading={update.isPending}
        />
      ) : (
        <ImapAccountForm
          onSubmit={(d) => create.mutate(d)}
          onCancel={() => setEditingId(null)}
          loading={create.isPending}
        />
      )}

      <ul className="space-y-2">
        {listQuery.data?.map((acc: any) => (
          <li key={acc.id} className="flex items-center justify-between border p-2 rounded-md">
            <span>{acc.email}</span>
            <div className="space-x-2">
              <Button size="sm" variant="outline" onClick={() => setEditingId(acc.id)}>
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => test.mutate(acc.id)}>
                Test Connection
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove.mutate(acc.id)}>
                Delete
              </Button>
              {onSelect && (
                <Button size="sm" variant="outline" onClick={() => onSelect(acc.id)}>
                  Open
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
