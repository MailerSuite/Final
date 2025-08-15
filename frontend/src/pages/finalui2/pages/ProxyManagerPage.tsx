import React, { useMemo, useState, useEffect } from 'react';
import PageShell from '../components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ProxyRow {
    id: string;
    host: string;
    port: number;
    region: string;
    status: 'healthy' | 'unhealthy' | 'testing';
    tags: string[];
}

const DEFAULT_PROXIES: ProxyRow[] = [
    { id: 'px_1', host: 'us1.proxy.local', port: 1080, region: 'us', status: 'healthy', tags: ['rotating'] },
    { id: 'px_2', host: 'eu1.proxy.local', port: 1080, region: 'eu', status: 'testing', tags: ['new'] },
    { id: 'px_3', host: 'ap1.proxy.local', port: 1080, region: 'ap', status: 'unhealthy', tags: ['backup'] },
];

const statusChip = (status: ProxyRow['status']) => {
    switch (status) {
        case 'healthy':
            return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Healthy</Badge>;
        case 'testing':
            return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Testing</Badge>;
        case 'unhealthy':
            return <Badge className="bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30">Unhealthy</Badge>;
    }
};

const ProxyManagerPage: React.FC = () => {
    const [initialLoading, setInitialLoading] = useState(true)
    const [query, setQuery] = useState('');
    const [host, setHost] = useState('');
    const [port, setPort] = useState('1080');
    const [region, setRegion] = useState('us');
    const [proxies, setProxies] = useState<ProxyRow[]>(DEFAULT_PROXIES);

    useEffect(() => {
        const id = requestAnimationFrame(() => setInitialLoading(false))
        return () => cancelAnimationFrame(id)
    }, [])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return proxies;
        return proxies.filter(p =>
            p.host.toLowerCase().includes(q) ||
            p.region.toLowerCase().includes(q) ||
            p.tags.some(t => t.includes(q))
        );
    }, [query, proxies]);

    const addProxy = () => {
        if (!host.trim()) return;
        setProxies(prev => [{ id: `px_${Date.now()}`, host, port: Number(port) || 1080, region, status: 'testing', tags: [] }, ...prev]);
        setHost('');
    };

    return (
        <PageShell title="Proxy Manager" subtitle="Centralize proxy pools, rotation rules, health checks, and assignments">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex items-center justify-between gap-4">
                        <CardTitle>Proxies</CardTitle>
                        {initialLoading ? (
                            <Skeleton className="h-9 w-64" />
                        ) : (
                            <Input placeholder="Search proxies..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-64 max-w-full" />
                        )}
                    </CardHeader>
                    <CardContent>
                        {initialLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <Skeleton key={i} className="h-10 w-full" />
                                ))}
                            </div>
                        ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[720px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Host</TableHead>
                                        <TableHead>Port</TableHead>
                                        <TableHead>Region</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tags</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.host}</TableCell>
                                            <TableCell>{p.port}</TableCell>
                                            <TableCell className="uppercase">{p.region}</TableCell>
                                            <TableCell>{statusChip(p.status)}</TableCell>
                                            <TableCell className="text-muted-foreground">{p.tags.join(', ') || '—'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Add Proxy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {initialLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-9 w-full" />
                                <Skeleton className="h-9 w-full" />
                                <Skeleton className="h-9 w-full" />
                                <Skeleton className="h-9 w-28" />
                            </div>
                        ) : (
                        <>
                            <Input placeholder="host/ip" value={host} onChange={(e) => setHost(e.target.value)} />
                            <Input placeholder="1080" type="number" value={port} onChange={(e) => setPort(e.target.value)} />
                            <Input placeholder="region (us, eu, ap)" value={region} onChange={(e) => setRegion(e.target.value)} />
                            <Button onClick={addProxy}>Add</Button>
                        </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageShell>
    );
};

export default ProxyManagerPage;

