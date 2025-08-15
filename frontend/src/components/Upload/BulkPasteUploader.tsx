import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import InfoIcon from '@/components/Icon/InfoIcon'
import { UploadCloud, Plus, FileText, RefreshCw } from 'lucide-react'
import { toast } from '@/hooks/smtp-checker/use-toast'
import { parseEmailList } from '@/utils/emailList'

interface BulkPasteUploaderProps {
  onSubmit: (values: string[]) => void
  loading?: boolean
}

export default function BulkPasteUploader({ onSubmit, loading }: BulkPasteUploaderProps) {
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [tab, setTab] = useState('paste')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = evt => {
      setText(evt.target?.result as string)
    }
    reader.readAsText(file)
  }

  const handleSubmit = () => {
    const allLines = text
      .split(/\r?\n/)
      .map(v => v.trim())
      .filter(Boolean)
    const emails = parseEmailList(text)
    if (emails.length === 0) {
      toast({
        description: 'No valid email addresses provided',
        severity: 'critical',
      })
      return
    }
    if (emails.length < allLines.length) {
      toast({
        description: `${allLines.length - emails.length} invalid entries ignored`,
      })
    }
    onSubmit(emails)
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-surface-3 border-border">
          <TabsTrigger value="paste">Paste Text</TabsTrigger>
          <TabsTrigger value="file">Upload File</TabsTrigger>
        </TabsList>
        <TabsContent value="paste" className="mt-4">
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="email@example.com (one per line or CSV)"
            className="h-40 font-mono text-xs"
          />
        </TabsContent>
        <TabsContent value="file" className="mt-4 space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <Label htmlFor="bulk-file" className="cursor-pointer">
              <span className="text-sm text-muted-foreground">Click to upload file or drag and drop</span>
              <Input
                id="bulk-file"
                type="file"
                accept=".txt,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </Label>
            {fileName && (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-green-400">
                <FileText className="w-4 h-4" />
                {fileName}
              </div>
            )}
          </div>
          {text && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">File Content Preview</Label>
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                className="h-24 bg-surface-2 border-border text-white font-mono text-sm"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
      <div className="p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg text-xs text-blue-200 flex items-start gap-2">
        <InfoIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Provide email addresses separated by new lines or a CSV file.</span>
      </div>
      <Button onClick={handleSubmit} disabled={loading} variant="primary">
        {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
        {loading ? 'Checking...' : '+ Bulk Blacklist Check'}
      </Button>
    </div>
  )
}
