import { format } from 'date-fns'
import { CheckResult, CheckStatus } from '@/types/checks'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import CheckStatusPicker from '@/components/check-status-picker/CheckStatusPicker'

interface HistoryTableProps {
  checks: CheckResult[]
  onChange: (id: string, status: CheckStatus) => void
  loadingId?: string
}

export default function HistoryTable({ checks, onChange, loadingId }: HistoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Timestamp</TableHead>
          <TableHead>Summary</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {checks.map((c) => (
          <TableRow key={c.id}>
            <TableCell>{format(new Date(c.ranAt), 'Pp')}</TableCell>
            <TableCell>{c.summary || '-'}</TableCell>
            <TableCell>
              <CheckStatusPicker
                currentStatus={c.status}
                loading={loadingId === c.id}
                onChange={(s) => onChange(c.id, s)}
              />
            </TableCell>
          </TableRow>
        ))}
        {checks.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
              No history
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
