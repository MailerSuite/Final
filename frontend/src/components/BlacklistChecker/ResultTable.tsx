import { ProviderCheck } from '@/api/blacklist'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import StatusBadge from '@/components/ui/StatusBadge'
import { mapStatus } from './status'

interface Props {
  results: ProviderCheck[]
}

function toTitleCase(value: string) {
  return value.replace(/(^|\s|_)([a-z])/g, (_, p1, p2) => p1.replace('_', ' ') + p2.toUpperCase())
}

export default function ResultTable({ results }: Props) {
  return (
    <Table className="text-sm">
      <TableHeader>
        <TableRow>
          <TableHead>Provider</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Message</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map(r => (
          <TableRow key={r.provider}>
            <TableCell>{toTitleCase(r.provider)}</TableCell>
            <TableCell><StatusBadge status={mapStatus(r.status as any)} /></TableCell>
            <TableCell>{r.message || '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
