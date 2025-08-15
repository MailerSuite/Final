import React, { useState } from 'react';
import PageShell from '../components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PlayIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const MailboxSettingsPage: React.FC = () => {
    const [imapHost, setImapHost] = useState('');
    const [imapPort, setImapPort] = useState('993');
    const [imapUser, setImapUser] = useState('');
    const [imapPass, setImapPass] = useState('');
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState('587');
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPass, setSmtpPass] = useState('');
    const [testing, setTesting] = useState(false);

    const testConnection = async () => {
        try {
            setTesting(true);
            // TODO: wire to backend test endpoints if available
            await new Promise((r) => setTimeout(r, 800));
            alert('Test succeeded (mock).');
        } finally {
            setTesting(false);
        }
    };

    return (
        <PageShell title="Mailbox Settings" subtitle="Configure IMAP/SMTP for inboxes">
            <Card>
                <CardHeader>
                    <CardTitle>Connection Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-foreground">IMAP</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <Label>Host</Label>
                                    <Input placeholder="imap.example.com" value={imapHost} onChange={(e) => setImapHost(e.target.value)} />
                                </div>
                                <div>
                                    <Label>Port</Label>
                                    <Input placeholder="993" value={imapPort} onChange={(e) => setImapPort(e.target.value)} />
                                </div>
                                <div>
                                    <Label>Username</Label>
                                    <Input placeholder="user@example.com" value={imapUser} onChange={(e) => setImapUser(e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <Label>Password</Label>
                                    <Input type="password" placeholder="••••••••" value={imapPass} onChange={(e) => setImapPass(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-foreground">SMTP</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <Label>Host</Label>
                                    <Input placeholder="smtp.example.com" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
                                </div>
                                <div>
                                    <Label>Port</Label>
                                    <Input placeholder="587" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
                                </div>
                                <div>
                                    <Label>Username</Label>
                                    <Input placeholder="user@example.com" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <Label>Password</Label>
                                    <Input type="password" placeholder="••••••••" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-2" />
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={testConnection} disabled={testing}>{testing ? <><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />Testing…</> : <><PlayIcon className="w-4 h-4 mr-2" />Test Connection</>}</Button>
                        <Button><CheckCircleIcon className="w-4 h-4 mr-2" />Save</Button>
                    </div>
                </CardContent>
            </Card>
        </PageShell>
    );
};

export default MailboxSettingsPage;

