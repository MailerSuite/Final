import Shell from '@/components/layouts/Shell';
import { Card, CardContent } from '@/components/ui/card';

export default function ContactPage() {
  return (
    <Shell
      title="Contact Us"
      subtitle="We're here to help 24/7."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <Card variant="glass" className="border-border/40">
            <CardContent className="space-y-1">
              <h2 className="text-lg font-semibold">Support</h2>
              <p className="text-sm text-muted-foreground">support@spamgpt.com</p>
            </CardContent>
          </Card>
          <Card variant="glass" className="border-border/40">
            <CardContent className="space-y-1">
              <h2 className="text-lg font-semibold">Sales</h2>
              <p className="text-sm text-muted-foreground">sales@spamgpt.com</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

