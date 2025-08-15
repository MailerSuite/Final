import React from 'react'
import Shell from '@/components/layouts/Shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Sparkles, ShieldCheck, Layers } from 'lucide-react'

export default function HelpPage() {
  return (
    <Shell
      title="Help Center"
      subtitle="Guides, FAQs, and resources to get you productive fast."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Help' }]}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Card variant="glass" className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Getting Started</CardTitle>
              <CardDescription className="text-xs">First steps to success</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Setup workspace, add SMTP/IMAP, and send your first campaign.</p>
              <Button asChild size="sm" className="btn-compact"><a href="/hub">Open Quickstart</a></Button>
            </CardContent>
          </Card>
          <Card variant="glass" className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4" /> Best Practices</CardTitle>
              <CardDescription className="text-xs">Improve deliverability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Warmup, list hygiene, authentication, and content tips.</p>
              <Button asChild size="sm" variant="outline" className="btn-compact"><a href="/status">Check System Status</a></Button>
            </CardContent>
          </Card>
          <Card variant="glass" className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4" /> API & Integrations</CardTitle>
              <CardDescription className="text-xs">Developer resources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Use our API to integrate campaigns, contacts, and analytics.</p>
              <Button asChild size="sm" variant="outline" className="btn-compact"><a href="/contact">Contact us</a></Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <Card variant="glass" className="border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>FAQs</CardTitle>
              <Badge variant="secondary" className="badge-compact">Updated</Badge>
            </div>
            <CardDescription>Common questions about campaigns, deliverability, and billing.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="faq-1">
                <AccordionTrigger>How do I create my first campaign?</AccordionTrigger>
                <AccordionContent>
                  Go to Campaigns → New Campaign, select a template, define your audience, and schedule. Use the AI Assistant to generate copy.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2">
                <AccordionTrigger>What authentication do I need?</AccordionTrigger>
                <AccordionContent>
                  Configure SPF, DKIM, and DMARC on your sending domain. The Domains page includes records and health checks.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-3">
                <AccordionTrigger>How can I improve open rates?</AccordionTrigger>
                <AccordionContent>
                  Test subject lines, segment audiences, send at optimal times, and keep content concise. Check Analytics for performance insights.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-4">
                <AccordionTrigger>Where can I find invoices?</AccordionTrigger>
                <AccordionContent>
                  Account → Billing contains invoices and plan details. For purchasing questions, reach out to sales.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-5">
                <AccordionTrigger>Do you support two-factor authentication?</AccordionTrigger>
                <AccordionContent>
                  Yes, enable 2FA under Account → Security. We recommend using an authenticator app for increased security.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="card-compact">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500" /> System Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> All systems operational</div>
            <Button asChild size="sm" variant="outline" className="btn-compact"><a href="/status">View status</a></Button>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
