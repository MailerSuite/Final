import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import TemplateOptionsPanel, {
  TemplateOptions,
  defaultOptions,
} from '@/components/TemplateOptionsPanel'
import {
  randomizeContent,
  validatePlaceholders,
} from "@/utils/htmlRandomizer";
import axios from '@/http/axios'
import { toast } from "@/hooks/smtp-checker/use-toast";

interface RandomizationPanelProps {
  value: string
  onChange: (val: string) => void
  className?: string
}

const RandomizationPanel = ({ value, onChange, className }: RandomizationPanelProps) => {
  const [choiceInput, setChoiceInput] = useState("");
  const [regexInput, setRegexInput] = useState("");
  const [error, setError] = useState("");
  const [serverVariants, setServerVariants] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<TemplateOptions>(defaultOptions)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'html'>(
    'desktop',
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (text: string) => {
    const area = textareaRef.current;
    if (!area) {
      onChange(value + text);
      return;
    }
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const newVal = value.slice(0, start) + text + value.slice(end);
    onChange(newVal);
    requestAnimationFrame(() => {
      area.selectionStart = area.selectionEnd = start + text.length;
      area.focus();
    });
  };

  const handleAddChoice = () => {
    if (!choiceInput) return;
    insertAtCursor(`{${choiceInput}}`);
    setChoiceInput("");
  };

  const handleAddRegex = () => {
    if (!regexInput) return;
    insertAtCursor(regexInput);
    setRegexInput("");
  };

  useEffect(() => {
    if (!value) {
      setError('')
      setServerVariants([])
      return
    }
    setError(validatePlaceholders(value) ? '' : 'Invalid placeholder syntax')
    setServerVariants([])
  }, [value])

  const previewVariants = useMemo(() => {
    if (error) return []
    return Array.from({ length: options.variantsCount }, () =>
      randomizeContent(value),
    )
  }, [error, value, options.variantsCount])

  const fetchServerPreview = async () => {
    if (error) return
    try {
      setLoading(true)
      const { data } = await axios.post('/templates/variants', {
        html: value,
        options,
      })
      setServerVariants(Array.isArray(data.variants) ? data.variants : [])
    } catch {
      toast({ description: 'Server preview failed', severity: 'critical' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="HTML content"
        className="min-h-32"
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="option1|option2"
            value={choiceInput}
            onChange={(e) => setChoiceInput(e.target.value)}
          />
          <Button type="button" onClick={handleAddChoice}>
            Insert Choice
          </Button>
        </div>
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="[A-Z]{3}[0-9]{2}"
            value={regexInput}
            onChange={(e) => setRegexInput(e.target.value)}
          />
          <Button type="button" onClick={handleAddRegex}>
            Insert Regex
          </Button>
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {!error && (
        <div className="border rounded-md p-3 space-y-3">
          <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="desktop">Desktop</TabsTrigger>
              <TabsTrigger value="mobile">Mobile</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previewVariants.map((html, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>Variant {i + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  {previewMode === 'html' ? (
                    <pre className="bg-card text-white p-2 rounded font-mono overflow-auto h-64">
                      {html}
                    </pre>
                  ) : (
                    <div className={previewMode === 'desktop' ? 'desktop-preview' : 'mobile-preview'}>
                      <iframe title={`preview-${i}`} srcDoc={html} className="w-full h-full border" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <Button type="button" onClick={fetchServerPreview} disabled={loading} className="mt-2">
            {loading ? 'Loading...' : 'Preview from Server'}
          </Button>
          {serverVariants.length > 0 && (
            <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {serverVariants.map((html, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle>Server Variant {i + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {previewMode === 'html' ? (
                      <pre className="bg-card text-white p-2 rounded font-mono overflow-auto h-64">
                        {html}
                      </pre>
                    ) : (
                      <div className={previewMode === 'desktop' ? 'desktop-preview' : 'mobile-preview'}>
                        <iframe title={`server-${i}`} srcDoc={html} className="w-full h-full border" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      <TemplateOptionsPanel options={options} onChange={setOptions} />
    </div>
  );
};

export default RandomizationPanel;
