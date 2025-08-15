import { useState } from 'react'
import { Input } from '@/components/ui/input'
import Loader from '@/components/common/Loader'
import ErrorAlert from '@/components/common/ErrorAlert'
import { useImapFolders } from '@/hooks/useImapFolders'
import { useImapMessage } from '@/hooks/useImapMessage'
import MessageDrawer from './MessageDrawer'

interface Props { accountId: string }

export default function EmailsList({ accountId }: Props) {
  const { foldersQuery, messagesQuery } = useImapFolders(accountId)
  const [folder, setFolder] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const messages = messagesQuery(folder, search)
  const [openMessageId, setOpenMessageId] = useState<string | undefined>()
  const message = useImapMessage(openMessageId)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          className="bg-background border rounded p-1"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
        >
          <option value="">Select folder</option>
          {foldersQuery.data?.map((f) => (
            <option key={f.name} value={f.name}>
              {f.name}
            </option>
          ))}
        </select>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" />
      </div>

      {messages.isLoading && <Loader />}
      {messages.error && <ErrorAlert message="Failed to load messages" />}
      <ul className="space-y-2">
        {messages.data?.map((m: any) => (
          <li
            key={m.id}
            className="border p-2 rounded-md cursor-pointer"
            onClick={() => setOpenMessageId(m.id)}
          >
            <span className="font-semibold mr-2">{m.subject}</span>
            <span className="text-sm text-muted-foreground">{m.sender}</span>
          </li>
        ))}
      </ul>

      <MessageDrawer openId={openMessageId} onOpenChange={setOpenMessageId} query={message} />
    </div>
  )
}
