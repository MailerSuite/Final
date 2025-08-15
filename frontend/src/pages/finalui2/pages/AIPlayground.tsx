import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import ProBadge from '@/components/ui/ProBadge';
import { cn } from '@/lib/utils';
import {
  BeakerIcon,
  ServerIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  KeyIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  InboxIcon,
  CpuChipIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { Sparkles } from 'lucide-react'

export const AIPlayground: React.FC = () => {
  const [activeTab, setActiveTab] = useState('smtp');
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: '587',
    username: '',
    password: '',
    encryption: 'TLS'
  });
  const [imapConfig, setImapConfig] = useState({
    host: '',
    port: '993',
    username: '',
    password: '',
    ssl: true
  });
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const handleSMTPTest = async () => {
    setTesting(true);
    // Simulate SMTP test
    setTimeout(() => {
      setTestResults({
        success: true,
        message: 'SMTP connection successful',
        details: {
          server: smtpConfig.host,
          port: smtpConfig.port,
          encryption: smtpConfig.encryption,
          authMethod: 'LOGIN',
          responseTime: '245ms',
          capabilities: ['PIPELINING', 'SIZE 35882577', '8BITMIME', 'AUTH LOGIN PLAIN']
        }
      });
      setTesting(false);
    }, 2000);
  };

  const handleIMAPTest = async () => {
    setTesting(true);
    // Simulate IMAP test
    setTimeout(() => {
      setTestResults({
        success: true,
        message: 'IMAP connection successful',
        details: {
          server: imapConfig.host,
          port: imapConfig.port,
          ssl: imapConfig.ssl,
          folders: ['INBOX (1,245)', 'Sent (523)', 'Drafts (12)', 'Spam (89)', 'Trash (0)'],
          totalMessages: 1869,
          responseTime: '312ms'
        }
      });
      setTesting(false);
    }, 2000);
  };

  const emailTools = [
    {
      id: 'smtp',
      name: 'SMTP Checker',
      icon: CloudArrowUpIcon,
      description: 'Test SMTP server connections and authentication',
      color: 'blue'
    },
    {
      id: 'imap',
      name: 'IMAP Retrieval',
      icon: CloudArrowDownIcon,
      description: 'Connect and retrieve emails from IMAP servers',
      color: 'green'
    },
    {
      id: 'spam',
      name: 'Spam Analyzer',
      icon: ShieldCheckIcon,
      description: 'AI-powered spam score prediction and analysis',
      color: 'orange',
      pro: true
    },
    {
      id: 'warmup',
      name: 'Email Warmup',
      icon: BoltIcon,
      description: 'Automated inbox warming for better deliverability',
      color: 'purple',
      pro: true
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Tools Playground</h1>
          <p className="text-muted-foreground">Test and debug email infrastructure with AI assistance</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <CpuChipIcon className="w-4 h-4" />
          Developer Mode
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {emailTools.map((tool) => (
          <Card
            key={tool.id}
            className={cn(
              "p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
              activeTab === tool.id && "border-primary shadow-lg"
            )}
            onClick={() => setActiveTab(tool.id)}
          >
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
              tool.color === 'blue' && "bg-blue-500/10 text-blue-500",
              tool.color === 'green' && "bg-green-500/10 text-green-500",
              tool.color === 'orange' && "bg-orange-500/10 text-orange-500",
              tool.color === 'purple' && "bg-purple-500/10 text-purple-500"
            )}>
              <tool.icon className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{tool.name}</h3>
              {tool.pro && <ProBadge />}
            </div>
            <p className="text-sm text-muted-foreground">{tool.description}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'smtp' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">SMTP Server Checker</h2>
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI can auto-detect settings
              </Badge>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.gmail.com"
                    value={smtpConfig.host}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Port</Label>
                  <select
                    id="smtp-port"
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="25">25 (No encryption)</option>
                    <option value="587">587 (TLS/STARTTLS)</option>
                    <option value="465">465 (SSL)</option>
                    <option value="2525">2525 (Alternative)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Username</Label>
                  <Input
                    id="smtp-username"
                    placeholder="your@email.com"
                    value={smtpConfig.username}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Password</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    placeholder="••••••••"
                    value={smtpConfig.password}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Encryption</Label>
                <div className="flex flex-wrap gap-4">
                  {['None', 'TLS', 'SSL'].map((enc) => (
                    <div key={enc} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`enc-${enc}`}
                        value={enc}
                        checked={smtpConfig.encryption === enc}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, encryption: e.target.value })}
                        className="text-primary"
                      />
                      <Label htmlFor={`enc-${enc}`} className="font-normal">
                        {enc === 'TLS' ? 'TLS/STARTTLS' : enc}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSMTPTest}
                disabled={testing || !smtpConfig.host}
                className="w-full"
              >
                {testing ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <ServerIcon className="w-4 h-4 mr-2" />
                    Test SMTP Connection
                  </>
                )}
              </Button>
            </div>

            {testResults && (
              <Card className={cn(
                "mt-6 p-4",
                testResults.success ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"
              )}>
                <div className="flex items-center gap-3 mb-4">
                  {testResults.success ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                  <h3 className="font-semibold">{testResults.message}</h3>
                </div>
                {testResults.details && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Server:</span>
                        <div className="font-medium">{testResults.details.server}:{testResults.details.port}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Encryption:</span>
                        <div className="font-medium">{testResults.details.encryption}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Response Time:</span>
                        <div className="font-medium">{testResults.details.responseTime}</div>
                      </div>
                    </div>
                    {testResults.details.capabilities && (
                      <div>
                        <span className="text-sm text-muted-foreground">Capabilities:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {testResults.details.capabilities.map((cap: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{cap}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}
          </Card>
        )}

        {activeTab === 'imap' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">IMAP Email Retrieval</h2>
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI-powered email parsing
              </Badge>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imap-host">IMAP Host</Label>
                  <Input
                    id="imap-host"
                    placeholder="imap.gmail.com"
                    value={imapConfig.host}
                    onChange={(e) => setImapConfig({ ...imapConfig, host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imap-port">Port</Label>
                  <select
                    id="imap-port"
                    value={imapConfig.port}
                    onChange={(e) => setImapConfig({ ...imapConfig, port: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="143">143 (No SSL)</option>
                    <option value="993">993 (SSL/TLS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imap-username">Username</Label>
                  <Input
                    id="imap-username"
                    placeholder="your@email.com"
                    value={imapConfig.username}
                    onChange={(e) => setImapConfig({ ...imapConfig, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imap-password">Password</Label>
                  <Input
                    id="imap-password"
                    type="password"
                    placeholder="••••••••"
                    value={imapConfig.password}
                    onChange={(e) => setImapConfig({ ...imapConfig, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="imap-ssl"
                  checked={imapConfig.ssl}
                  onChange={(e) => setImapConfig({ ...imapConfig, ssl: e.target.checked })}
                  className="text-primary"
                />
                <Label htmlFor="imap-ssl" className="font-normal">Use SSL/TLS</Label>
              </div>

              <Button
                onClick={handleIMAPTest}
                disabled={testing || !imapConfig.host}
                className="w-full"
              >
                {testing ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    Connecting to IMAP...
                  </>
                ) : (
                  <>
                    <InboxIcon className="w-4 h-4 mr-2" />
                    Connect & Retrieve
                  </>
                )}
              </Button>
            </div>

            {testResults && testResults.details?.folders && (
              <Card className="mt-6 p-4 border-green-500/50 bg-green-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold">Connected Successfully</h3>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Messages:</span>
                      <div className="font-medium">{testResults.details.totalMessages}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Response Time:</span>
                      <div className="font-medium">{testResults.details.responseTime}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Folders:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {testResults.details.folders.map((folder: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-background rounded-md border">
                          <EnvelopeIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{folder}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </Card>
        )}

        {activeTab === 'spam' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">AI Spam Analyzer</h2>
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                Powered by GPT-4
              </Badge>
            </div>
            <div className="text-center py-12 space-y-4">
              <ShieldCheckIcon className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-semibold">Advanced Spam Detection</h3>
              <p className="text-muted-foreground">AI-powered spam scoring with real-time suggestions</p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {['Content analysis', 'SPF/DKIM/DMARC validation', 'Blacklist checking', 'AI recommendations'].map((feature) => (
                  <Badge key={feature} variant="outline">{feature}</Badge>
                ))}
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'warmup' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Email Warmup Engine</h2>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                AI Automated
              </Badge>
            </div>
            <div className="text-center py-12 space-y-4">
              <BoltIcon className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-semibold">Intelligent Inbox Warming</h3>
              <p className="text-muted-foreground">Gradually build sender reputation with AI optimization</p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {['Automated sending patterns', 'Real inbox placement', 'Engagement simulation', 'Reputation monitoring'].map((feature) => (
                  <Badge key={feature} variant="outline">{feature}</Badge>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};