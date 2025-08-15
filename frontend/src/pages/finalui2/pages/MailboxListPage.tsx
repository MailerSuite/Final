import React, { useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface Mailbox {
    id: string;
    email: string;
    provider: 'gmail' | 'outlook' | 'yahoo' | 'custom';
    status: 'connected' | 'degraded' | 'disconnected';
    lastSync: string;
}

const DEFAULT_MAILBOXES: Mailbox[] = [
    { id: 'mbx_1', email: 'marketing@example.com', provider: 'gmail', status: 'connected', lastSync: '5m ago' },
    { id: 'mbx_2', email: 'sales@example.com', provider: 'outlook', status: 'degraded', lastSync: '12m ago' },
    { id: 'mbx_3', email: 'noreply@example.com', provider: 'custom', status: 'disconnected', lastSync: '—' },
];

const statusBadge = (status: Mailbox['status']) => {
    switch (status) {
        case 'connected':
            return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Connected</Badge>;
        case 'degraded':
            return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Degraded</Badge>;
        case 'disconnected':
            return <Badge className="bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30">Disconnected</Badge>;
    }
};

const MailboxListPage: React.FC = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const mailboxes = DEFAULT_MAILBOXES;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return mailboxes;
        return mailboxes.filter(m => m.email.toLowerCase().includes(q) || m.provider.includes(q as any));
    }, [query, mailboxes]);

    return (
        <PageShell title="Mailbox List" subtitle="List of inboxes">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle>Inboxes</CardTitle>
                    <div className="flex items-center gap-2">
                        <Input placeholder="Search email..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-64 max-w-full" />
                        <Button onClick={() => navigate('/smtp')}>Add Mailbox</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table className="min-w-[720px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Sync</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell className="font-medium">{m.email}</TableCell>
                                        <TableCell className="capitalize">{m.provider}</TableCell>
                                        <TableCell>{statusBadge(m.status)}</TableCell>
                                        <TableCell>{m.lastSync}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => navigate('/imap-inbox')}>Open</Button>
                                                <Button size="sm" variant="outline" onClick={() => navigate('/mailbox-settings')}>Settings</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </PageShell>
    );
};

export default MailboxListPage;

