import React from 'react';
import Shell from '@/components/layouts/Shell';
import { Card, CardContent } from '@/components/ui/card';

export default function StatusPage() {
  const items = [
    { name: 'API', status: 'Operational' },
    { name: 'SMTP', status: 'Operational' },
    { name: 'IMAP Checker', status: 'Degraded' },
  ];
  return (
    <Shell title="System Status" subtitle="Real-time operational status." breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Status' }]}>
      <div className="max-w-3xl mx-auto space-y-3">
        {items.map((it) => (
          <Card key={it.name} variant="outline">
            <CardContent className="flex items-center justify-between p-3">
              <span>{it.name}</span>
              <span className="text-sm text-muted-foreground">{it.status}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  );
}

