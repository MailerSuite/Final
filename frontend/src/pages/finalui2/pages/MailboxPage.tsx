import React from 'react';
import PageShell from '../components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const MailboxPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <PageShell title="Mailbox" subtitle="Overview of configured inboxes">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 rounded border border-emerald-500/30 bg-emerald-500/10">
                                <p className="text-xs text-emerald-400">Connected</p>
                                <p className="text-2xl font-semibold">2</p>
                            </div>
                            <div className="p-3 rounded border border-yellow-500/30 bg-yellow-500/10">
                                <p className="text-xs text-yellow-400">Degraded</p>
                                <p className="text-2xl font-semibold">1</p>
                            </div>
                            <div className="p-3 rounded border border-fuchsia-500/30 bg-fuchsia-500/10">
                                <p className="text-xs text-fuchsia-400">Disconnected</p>
                                <p className="text-2xl font-semibold">1</p>
                            </div>
                            <div className="p-3 rounded border border-blue-500/30 bg-blue-500/10">
                                <p className="text-xs text-blue-400">Queues</p>
                                <p className="text-2xl font-semibold">3</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button className="w-full" onClick={() => navigate('/imap-inbox')}>Open Inbox</Button>
                        <Button className="w-full" variant="outline" onClick={() => navigate('/mailbox-settings')}>Configure</Button>
                        <Button className="w-full" variant="outline" onClick={() => navigate('/smtp')}>Add SMTP</Button>
                    </CardContent>
                </Card>
            </div>
        </PageShell>
    );
};

export default MailboxPage;

