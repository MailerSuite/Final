import React, { useEffect, useState } from 'react';
import { Cog6ToothIcon, KeyIcon, ShieldCheckIcon, CpuChipIcon, ArrowPathIcon, CheckCircleIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
// Error audience functionality moved to stable API client
// For now, using simple error handling
const getErrorAudience = () => 'user';
const setErrorAudience = (audience: string) => console.log('Error audience set to:', audience);
type ErrorAudience = 'user' | 'admin' | 'developer';

export const AISettings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [anomalyAlerts, setAnomalyAlerts] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorAudience, setAudience] = useState<ErrorAudience>(getErrorAudience());

  useEffect(() => {
    const id = requestAnimationFrame(() => setInitialLoading(false));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="ai-settings-page">
      <div className="header">
        <div className="title">
          <Cog6ToothIcon className="w-5 h-5 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold">AI Settings</h1>
            <p className="text-blue-300/80">Configure models, keys, and smart features</p>
          </div>
        </div>
      </div>

      <div className="grid">
        <Card className="panel">
          <CardHeader className="pb-2"><CardTitle className="text-white text-base flex items-center gap-2"><KeyIcon className="w-5 h-5 text-emerald-400" />API Key</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>OpenAI API Key</Label>
              {initialLoading ? (
                <div className="flex gap-2 max-sm:flex-col">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              ) : (
                <div className="flex gap-2 max-sm:flex-col">
                  <Input type="password" placeholder="sk-..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(apiKey)} disabled={!apiKey}><DocumentDuplicateIcon className="w-4 h-4 mr-2" />Copy</Button>
                  <Button disabled={!apiKey}><CheckCircleIcon className="w-4 h-4 mr-2" />Save</Button>
                </div>
              )}
              <p className="text-xs text-blue-300/80">Stored securely on your server. Never shared.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader className="pb-2"><CardTitle className="text-white text-base flex items-center gap-2"><CpuChipIcon className="w-5 h-5 text-purple-400" />Model</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Label>Default model</Label>
            {initialLoading ? (
              <Skeleton className="h-9 w-[240px]" />
            ) : (
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-[240px]"><SelectValue placeholder="Model" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-blue-300/80">You can override per feature or workflow.</p>
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader className="pb-2"><CardTitle className="text-white text-base flex items-center gap-2"><ShieldCheckIcon className="w-5 h-5 text-blue-400" />Smart features</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {initialLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Auto optimization</div>
                    <div className="text-xs text-blue-300/80">Let AI tune send time, content and segments</div>
                  </div>
                  <Switch checked={autoOptimize} onCheckedChange={setAutoOptimize} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Anomaly alerts</div>
                    <div className="text-xs text-blue-300/80">Notify on deliverability or engagement drop</div>
                  </div>
                  <Switch checked={anomalyAlerts} onCheckedChange={setAnomalyAlerts} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Error audience mode</div>
                    <div className="text-xs text-blue-300/80">Controls how errors are presented to users</div>
                  </div>
                  <Select value={errorAudience} onValueChange={(v) => { setAudience(v as ErrorAudience); setErrorAudience(v as ErrorAudience) }}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="dev">Developer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline"><ArrowPathIcon className="w-4 h-4 mr-2" />Reset</Button>
              <Button><CheckCircleIcon className="w-4 h-4 mr-2" />Save Settings</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        .ai-settings-page { padding: 1.5rem; animation: fadeIn 0.3s ease-out; }
        .header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
        .title { display: flex; gap: 0.75rem; align-items: center; }
        .grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 1rem; margin-top: 1rem; }
        .panel { background: rgba(10,10,10,0.6); border: 1px solid rgba(255,255,255,0.1); }
        @media (max-width: 1100px) { .grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};