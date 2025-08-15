import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export type CompactEntry = {
  id: string;
  country?: string; // ISO-2 like "US"
  host: string;
  email?: string;
  user?: string;
  pass?: string;
  port?: number | string;
  ssl?: 'SSL' | 'TLS' | 'STARTTLS' | 'None' | string;
  type?: string; // e.g., AWS, STANDARD
  responseMs?: number;
  aiPrediction?: string; // short label
};

const countryToEmoji = (code?: string) => {
  if (!code) return '🏳️';
  const cc = code.toUpperCase();
  // Convert ASCII to regional indicator symbols
  const A = 0x1f1e6;
  const base = 'A'.charCodeAt(0);
  if (cc.length === 2) {
    const first = A + (cc.charCodeAt(0) - base);
    const second = A + (cc.charCodeAt(1) - base);
    return String.fromCodePoint(first) + String.fromCodePoint(second);
  }
  return '🏳️';
};

export interface CompactDataTableProps {
  title?: string;
  entries: CompactEntry[];
  caption?: string;
}

export const CompactDataTable: React.FC<CompactDataTableProps> = ({ title, entries, caption }) => {
  return (
    <Card className="bg-[var(--ai-bg-elevated)]/60 backdrop-blur-xl border-white/10">
      <div className="p-4">
        {title && <div className="text-sm font-semibold text-white mb-3 fx-inline" data-test-hover>{title}</div>}
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <Table>
            {caption && <TableCaption className="text-xs text-muted-foreground">{caption}</TableCaption>}
            <TableHeader>
              <TableRow>
                <TableHead className="w-[56px] text-xs text-muted-foreground">Country</TableHead>
                <TableHead className="text-xs text-muted-foreground">Host</TableHead>
                <TableHead className="text-xs text-muted-foreground">Email</TableHead>
                <TableHead className="text-xs text-muted-foreground">User</TableHead>
                <TableHead className="text-xs text-muted-foreground">Pass</TableHead>
                <TableHead className="text-right text-xs text-muted-foreground">Port</TableHead>
                <TableHead className="text-xs text-muted-foreground">SSL/TLS</TableHead>
                <TableHead className="text-xs text-muted-foreground">Type</TableHead>
                <TableHead className="text-right text-xs text-muted-foreground">Response</TableHead>
                <TableHead className="text-xs text-muted-foreground">AI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id} className="hover:bg-white/5">
                  <TableCell className="font-medium text-base">{countryToEmoji(e.country)}</TableCell>
                  <TableCell className="text-white truncate max-w-[220px] text-sm">{e.host || '-'}</TableCell>
                  <TableCell className="truncate max-w-[220px] text-sm text-muted-foreground">{e.email || '-'}</TableCell>
                  <TableCell className="truncate max-w-[160px] text-sm text-muted-foreground">{e.user || '-'}</TableCell>
                  <TableCell className="truncate max-w-[120px] text-sm text-muted-foreground">{e.pass ? '••••••••' : '-'}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{e.port ?? '-'}</TableCell>
                  <TableCell>
                    {e.ssl && e.ssl !== 'None' ? (
                      <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">{e.ssl}</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">None</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {e.type ? (
                      <Badge variant="outline" className="text-[10px] capitalize">{e.type}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {typeof e.responseMs === 'number' ? `${e.responseMs}ms` : '-'}
                  </TableCell>
                  <TableCell>
                    {e.aiPrediction ? (
                      <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">{e.aiPrediction}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
};

export default CompactDataTable;
