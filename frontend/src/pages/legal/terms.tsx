import React from 'react'
import Shell from '@/components/layouts/Shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export default function TermsPage() {
  return (
    <Shell
      title="Terms of Service"
      subtitle="Your agreement to use the platform responsibly and legally."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Legal', href: '/support' }, { label: 'Terms' }]}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card variant="glass" className="border-border/40">
          <CardHeader>
            <CardTitle>Platform Terms</CardTitle>
            <CardDescription>Based on our published terms on the main landing site.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="scope">
                <AccordionTrigger>Scope of Use</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    By using the platform, you agree to comply with all applicable laws and regulations regarding
                    email marketing. Misuse for illegal activities is strictly prohibited.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="prohibited">
                <AccordionTrigger>Prohibited Activities</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    <li>Illegal harvesting or purchasing of email addresses</li>
                    <li>Sending without proper consent or required notices</li>
                    <li>Abuse, fraud, or interference with platform security</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="compliance">
                <AccordionTrigger>Compliance</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    You are responsible for compliance with CAN-SPAM, GDPR, CCPA, and any other applicable laws.
                    Maintain valid sender identity, unsubscribe links, and accurate headers.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="changes">
                <AccordionTrigger>Changes to Terms</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    These terms may be updated with notice. Continued use after updates constitutes acceptance of the
                    new terms.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="liability">
                <AccordionTrigger>Liability</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    We do not guarantee specific deliverability outcomes. You assume all responsibility for how the
                    platform is used and resulting consequences.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
