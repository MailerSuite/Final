import { useState } from 'react'
import { RefreshCw, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useFolders from '@/hooks/useFolders'
import MailLoader from '@/components/ui/MailLoader'

interface Props {
  accountId?: string
}

export default function FoldersList({ accountId }: Props) {
  const { data: folders = [], refetch, isFetching } = useFolders(accountId)
  const [attemptedRefresh, setAttemptedRefresh] = useState(false)

  const handleRefresh = async () => {
    setAttemptedRefresh(true)
    await refetch()
  }

  if (isFetching) {
    return (
      <div className="p-6"><MailLoader size="md" /></div>
    )
  }

  if ((folders as unknown[]).length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-4 text-center text-muted-foreground">
        <p>No folders found. Click 'Refresh' or check your account settings.</p>
        <Button variant="secondary" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
        {attemptedRefresh && (
          <a
            href="https://docs.example.com/mail"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline hover:text-muted-foreground flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3" /> View docs
          </a>
        )}
      </div>
    )
  }

  return (
    <ul className="space-y-1">
      {(folders as unknown[]).map((folder: unknown) => (
        <li key={folder.name} className="px-2 py-1 rounded hover:bg-accent">
          {folder.name}
        </li>
      ))}
    </ul>
  )
}
