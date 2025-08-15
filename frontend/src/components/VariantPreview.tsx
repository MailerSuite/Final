import React from "react";
// Removed legacy template CSS to avoid global conflicts; use shadcn utilities only
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface Props {
  html: string;
  index: number;
}

export default function VariantPreview({ html, index }: Props) {
  const [mode, setMode] = React.useState<'html' | 'desktop' | 'mobile'>('desktop');
  const copy = () => navigator.clipboard.writeText(html);
  return (
    <AccordionItem value={`variant-${index}`} className="border rounded-md">
      <AccordionTrigger>Variant {index + 1}</AccordionTrigger>
      <AccordionContent className="space-y-2">
        <div className="flex border-b mb-2">
          {(['html', 'desktop', 'mobile'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              onClick={() => setMode(m)}
              className={`px-3 py-1 text-sm font-medium border-b-2 transition-colors ${mode === m ? 'border-primary' : 'border-transparent'}`}
            >
              {m === 'html' ? 'HTML' : m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        {mode === 'html' ? (
          <pre className="bg-card text-foreground p-2 rounded font-mono overflow-auto h-64 border border-border">
            {html}
          </pre>
        ) : (
          <div className={mode === 'desktop' ? 'desktop-preview' : 'mobile-preview'}>
            <iframe title={`variant-${index}`} srcDoc={html} className="w-full h-full border" />
          </div>
        )}
        <Button type="button" onClick={copy}>Copy HTML</Button>
      </AccordionContent>
    </AccordionItem>
  );
}
