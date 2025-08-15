import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getSmtpSettings, updateSmtpSettings } from '@/api/smtp-settings';
import PageShell from '../components/PageShell';
import MailLoader from '@/components/ui/MailLoader';

const SMTPSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<SmtpSettingsResponse | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        (async () => {
            try {
                const data = await getSmtpSettings()
                setSettings(data)
            } catch (e: unknown) {
                setError(e?.message || 'Failed to load settings')
            }
        })()
    }, [])

    const onSave = async () => {
        if (!settings) return
        setSaving(true)
        setError(null)
        try {
            const updated = await updateSmtpSettings(settings)
            setSettings(updated)
        } catch (e: unknown) {
            setError(e?.message || 'Failed to update settings')
        } finally {
            setSaving(false)
        }
    }

  return (
    <PageShell title="SMTP Settings" subtitle="Operational defaults used by the platform">
        <Card className="p-6 space-y-4">
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    {!settings && !error && (
                      <div className="py-8"><MailLoader size="md" /></div>
                    )}
                    {settings && (
                        <div className="space-y-4">
                            <div>
                                <Label>Default Timeout (seconds)</Label>
                                <Input type="number" value={settings.SMTP_DEFAULT_TIMEOUT} onChange={(e) => setSettings({ ...settings, SMTP_DEFAULT_TIMEOUT: Number(e.target.value) })} />
                            </div>
                            <div>
                                <Label>Rate Limit Per Hour</Label>
                                <Input type="number" value={settings.SMTP_RATE_LIMIT_PER_HOUR} onChange={(e) => setSettings({ ...settings, SMTP_RATE_LIMIT_PER_HOUR: Number(e.target.value) })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Max Retries</Label>
                                    <Input type="number" value={settings.SMTP_MAX_RETRIES} onChange={(e) => setSettings({ ...settings, SMTP_MAX_RETRIES: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <Label>Max Delay (ms)</Label>
                                    <Input type="number" value={settings.SMTP_MAX_DELAY} onChange={(e) => setSettings({ ...settings, SMTP_MAX_DELAY: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="pt-2">
                                <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
                            </div>
                        </div>
                    )}
        </Card>
    </PageShell>
    );
};

export default SMTPSettingsPage;

