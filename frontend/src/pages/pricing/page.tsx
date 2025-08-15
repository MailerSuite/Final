import Shell from '@/components/layouts/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PricingPage() {
  const tiers = [
    { name: 'Starter', price: '$29/mo', features: ['10k emails', 'Basic AI', 'Email analytics'] },
    { name: 'Pro', price: '$99/mo', features: ['100k emails', 'Advanced AI', 'Smart send'] },
    { name: 'Enterprise', price: 'Custom', features: ['Unlimited', 'Dedicated infra', '24/7 support'] },
  ];
  return (
    <Shell title="Pricing" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Pricing' }]}>
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-4">
        {tiers.map(t => (
          <Card key={t.name} variant={t.name === 'Pro' ? 'premium' : 'elevated'} animated>
            <CardHeader>
              <CardTitle className="flex items-baseline justify-between">
                <span>{t.name}</span>
                <span className="text-2xl">{t.price}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {t.features.map(f => <li key={f}>• {f}</li>)}
              </ul>
              <div className="mt-4">
                <Button className="w-full">Choose {t.name}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  );
}

