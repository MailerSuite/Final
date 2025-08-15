import React from 'react'
import Shell from '@/components/layouts/Shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export default function PrivacyPage() {
  return (
    <Shell
      title="Privacy Policy"
      subtitle="How we handle data responsibly and securely."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Legal', href: '/support' }, { label: 'Privacy' }]}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card variant="glass" className="border-border/40">
          <CardHeader>
            <CardTitle>Our Commitment</CardTitle>
            <CardDescription>Aligned with the privacy terms on our main landing site.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="principles">
                <AccordionTrigger>Principles</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    <li>Process data lawfully and for legitimate purposes</li>
                    <li>Limit collection to what is necessary for the service</li>
                    <li>Protect data with reasonable security measures</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="rights">
                <AccordionTrigger>Your Rights</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    <li>Access, correction, and deletion (subject to law)</li>
                    <li>Portability, restriction, and objection where applicable</li>
                    <li>Contact support for privacy requests</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="security">
                <AccordionTrigger>Security</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    We apply administrative, technical, and organizational measures to safeguard data. Users should
                    also follow best practices for account security.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="changes">
                <AccordionTrigger>Changes</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    We may update this policy. Material changes will be communicated in-app; continued use signifies
                    acceptance of updates.
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
