import React from 'react'
import Shell from '@/components/layouts/Shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { LifeBuoy, Mail, MessagesSquare, FileText, ShieldCheck, Phone } from 'lucide-react'

export default function SupportPage() {
  return (
    <Shell
      title="Support"
      subtitle="We're here to help 24/7. Reach out anytime."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Support' }]}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Search / Quick Ask */}
        <Card className="card-compact">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input placeholder="Search help or type your question..." className="input-compact" />
              </div>
              <Button className="btn-compact">Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Options */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card variant="glass" className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Email Support</CardTitle>
              <CardDescription className="text-xs">Average reply in under 2 hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">support@mailersuite.com</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="badge-compact">24/7</Badge>
                <Badge variant="secondary" className="badge-compact">Priority for Pro</Badge>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass" className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><MessagesSquare className="h-4 w-4" /> Live Chat</CardTitle>
              <CardDescription className="text-xs">Instant help from our team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Weekdays 9am–6pm (your timezone)</p>
              <Button size="sm" className="btn-compact">Start Chat</Button>
            </CardContent>
          </Card>
          <Card variant="glass" className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Docs & Guides</CardTitle>
              <CardDescription className="text-xs">Step-by-step tutorials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Templates, deliverability, API, and more</p>
              <Button asChild size="sm" variant="outline" className="btn-compact">
                <a href="/help">Browse Help Center</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status & SLA */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="card-compact">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500" /> System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                All systems operational
              </div>
              <Button asChild size="sm" variant="outline" className="btn-compact">
                <a href="/status">View detailed status</a>
              </Button>
            </CardContent>
          </Card>
          <Card className="card-compact">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4" /> SLAs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex items-center justify-between"><span>Email</span><Badge variant="outline" className="badge-compact">2h</Badge></div>
              <div className="flex items-center justify-between"><span>Live Chat</span><Badge variant="outline" className="badge-compact">5m</Badge></div>
              <div className="flex items-center justify-between"><span>Priority (Pro)</span><Badge variant="outline" className="badge-compact">1h</Badge></div>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <Card variant="glass" className="border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-4 w-4" />
                <CardTitle>Frequently Asked Questions</CardTitle>
              </div>
              <Badge variant="secondary" className="badge-compact">Updated</Badge>
            </div>
            <CardDescription>Answers to common questions about setup, deliverability, and billing.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="getting-started-1">
                <AccordionTrigger>How do I connect SMTP and IMAP?</AccordionTrigger>
                <AccordionContent>
                  Go to Settings → SMTP/IMAP, click “Add account”, and follow the guided setup. You can test connections under Tools → SMTP Checker and IMAP Inbox.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="campaigns-1">
                <AccordionTrigger>Why are my emails going to spam?</AccordionTrigger>
                <AccordionContent>
                  Ensure SPF, DKIM, and DMARC are configured. Warm up new domains gradually, throttle sends, and keep lists clean. See Help → Deliverability Guide.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="templates-1">
                <AccordionTrigger>Can I create reusable templates?</AccordionTrigger>
                <AccordionContent>
                  Yes. Use Templates to build and version content. The Template Builder supports blocks and variables for personalization.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="billing-1">
                <AccordionTrigger>How does billing work?</AccordionTrigger>
                <AccordionContent>
                  Billing is monthly with prorated upgrades. Invoices are available under Account → Billing. Contact sales@mailersuite.com for enterprise plans.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="security-1">
                <AccordionTrigger>Do you support 2FA and API keys?</AccordionTrigger>
                <AccordionContent>
                  Yes. Enable 2FA under Account → Security. Create and rotate API keys under Account → API Keys. Keys can be scoped and revoked.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Legal & Policies (imported from main landing) */}
        <Card variant="glass" className="border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <CardTitle>Legal & Policies</CardTitle>
              </div>
              <Badge variant="secondary" className="badge-compact">Updated</Badge>
            </div>
            <CardDescription>Key legal terms, privacy commitments, and our anti-abuse stance.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="terms-of-service">
                <AccordionTrigger>Terms of Service</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    By using the platform, you agree to comply with all applicable laws and regulations
                    regarding email marketing. Misuse of this platform for illegal activities is strictly
                    prohibited.
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                    <li>Do not harvest email addresses illegally</li>
                    <li>Respect CAN-SPAM, GDPR, CCPA, and local regulations</li>
                    <li>Terms may be updated with notice; continued use constitutes acceptance</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="privacy-policy">
                <AccordionTrigger>Privacy Policy</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Your privacy matters. We are committed to protecting your personal information and
                    ensuring secure handling of data.
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                    <li>Data is processed for legitimate purposes only</li>
                    <li>GDPR and CCPA aligned practices</li>
                    <li>Access, correction, and deletion rights respected</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="anti-abuse">
                <AccordionTrigger>Anti‑Abuse Policy</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Zero‑tolerance for abuse. Any misuse of our platform will result in immediate account
                    suspension and may lead to legal action.
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                    <li>Automated abuse detection and enforcement</li>
                    <li>Escalation up to termination for repeated violations</li>
                    <li>
                      Report abuse to
                      {' '}<a className="underline" href="mailto:abuse@mailersuite.com">abuse@mailersuite.com</a>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="legal-disclaimer">
                <AccordionTrigger>Legal Disclaimer</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    You are solely responsible for how the platform is used, including compliance with
                    applicable laws, acceptable‑use policies, and provider terms. We make no guarantees
                    about specific deliverability outcomes and accept no liability for misuse by clients.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    For legal inquiries, contact
                    {' '}<a className="underline" href="mailto:legal@mailersuite.com">legal@mailersuite.com</a>.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Footer CTA */}
        <Card className="card-compact">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Still need help?</div>
              <div className="text-xs text-muted-foreground">Our team typically responds within minutes on live chat.</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="btn-compact">Email support</Button>
              <Button size="sm" className="btn-compact">Open live chat</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
