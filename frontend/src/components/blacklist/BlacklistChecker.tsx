import { useState, FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from '@/hooks/smtp-checker/use-toast'
import {
  blacklistApi,
  ProviderCheck,
  BlacklistResponse,
} from '@/api/blacklist'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import BlacklistDetailsDialog from './BlacklistDetailsDialog'

import InfoIcon from '@/components/Icon/InfoIcon'
import WarningIcon from '@/components/Icon/WarningIcon'
import { BlacklistIcon } from '@/components/Icon/BlacklistIcon'
import { CheckCircle, Clock, Plus, Search, RefreshCw } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import BulkPasteUploader from '@/components/Upload/BulkPasteUploader'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Result extends BlacklistResponse {
  value: string
}

const PROVIDERS = [
  { id: 'spamhaus', name: 'Spamhaus' },
  { id: 'spamcop', name: 'SpamCop' },
  { id: 'barracuda', name: 'Barracuda' },
  { id: 'sorbs', name: 'SORBS' },
]

const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const domainRegex =
  /^(?!:\/\/)([a-zA-Z0-9](?:[a-zA-Z0-9-_]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9-_]+)+)$/;

export default function BlacklistChecker() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<string[]>(PROVIDERS.map((p) => p.id))
  const [detail, setDetail] = useState<ProviderCheck | null>(null)
  const [showBulk, setShowBulk] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResults, setBulkResults] = useState<(Result & { error?: string })[]>([])

  const validate = (val: string) => ipRegex.test(val) || domainRegex.test(val);

  const toggleProvider = (id: string) => {
    setProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!validate(trimmed)) {
      toast({
        description: "Enter a valid domain or IP",
        severity: 'critical',
      });
      return;
    }
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const data: BlacklistResponse = ipRegex.test(trimmed)
        ? await blacklistApi.checkIp(trimmed, providers)
        : await blacklistApi.checkDomain(trimmed, providers)
      setResult({ value: trimmed, ...data })
    } catch (error: any) {
      const message = error.response.data.detail || "Blacklist check failed";
      setError("Unable to fetch blacklist status.");
      toast({ description: message, severity: 'critical' });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (values: string[]) => {
    setBulkResults([])
    setBulkLoading(true)
    const results: (Result & { error?: string })[] = []
    for (const v of values) {
      if (!validate(v)) {
        results.push({ value: v, detected: 0, total: 0, results: [], error: 'invalid input' })
        continue
      }
      try {
        const data: BlacklistResponse = ipRegex.test(v)
          ? await blacklistApi.checkIp(v, providers)
          : await blacklistApi.checkDomain(v, providers)
        results.push({ value: v, ...data })
      } catch (err: any) {
        const message = err?.response?.data?.detail || 'check failed'
        results.push({ value: v, detected: 0, total: 0, results: [], error: message })
      }
    }
    setBulkResults(results)
    setBulkLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blacklist Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="query">Domain or IP</Label>
            <Input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="example.com or 1.1.1.1"
            />
          </div>
          <div className="space-y-1">
            <Label>Select Providers</Label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    id={`provider-${p.id}`}
                    checked={providers.includes(p.id)}
                    onCheckedChange={() => toggleProvider(p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading || providers.length === 0}>
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Checking...' : 'Check'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowBulk((p) => !p)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Bulk Blacklist Check
            </Button>
          </div>
        </form>
        {showBulk && (
          <BulkPasteUploader onSubmit={handleBulkSubmit} loading={bulkLoading} />
        )}
        {error && <p className="text-destructive">{error}</p>}
        {result && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="font-mono break-all">{result.value}</p>
              <p>
                {result.detected}/{result.total} blacklists detected
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>Status icon</TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <BlacklistIcon className="inline w-4 h-4 mr-1 text-red-400" />
                      Provider
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>Blacklist provider</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Status
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>listed, clean or error</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Message
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>Provider response message</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Response
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>Response time in ms</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Checked
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>Timestamp checked</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead className="w-10">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>View full details</TooltipContent>
                    </Tooltip>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.results.map((r) => (
                  <TableRow
                    key={r.provider}
                    className="cursor-pointer"
                    onClick={() => setDetail(r)}
                  >
                    <TableCell className="pr-2">
                      {r.status === 'listed' ? (
                        <BlacklistIcon className="text-destructive" />
                      ) : r.status === 'error' ? (
                        <WarningIcon className="w-4 h-4" />
                      ) : r.status === 'timeout' ? (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <BlacklistIcon className="inline w-4 h-4 mr-1 text-red-400" />
                      {r.provider}
                    </TableCell>
                    <TableCell>
                      {r.status === 'listed' ? (
                        <span className="text-destructive">blacklisted</span>
                      ) : r.status === 'error' ? (
                        <span className="text-yellow-500">error</span>
                      ) : r.status === 'timeout' ? (
                        <span className="text-yellow-500">timeout</span>
                      ) : (
                        <span className="text-green-500">clean</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate">
                      {r.message || '—'}
                    </TableCell>
                    <TableCell>{r.response_time_ms} ms</TableCell>
                    <TableCell>
                      {new Date(r.checked_at).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      {(r.status === 'error' || r.message) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDetail(r)
                          }}
                          aria-label="View details"
                        >
                          <InfoIcon severity={r.status === 'error' ? 'error' : 'info'} />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {bulkResults.length > 0 && (
          <ScrollArea className="max-h-96 pr-4">
            <div className="space-y-8">
              {bulkResults.map((res) => (
                <div key={res.value} className="space-y-2">
                  <div className="space-y-1">
                    <p className="font-mono break-all">{res.value}</p>
                    {res.error ? (
                      <p className="text-destructive text-sm">{res.error}</p>
                    ) : (
                      <p>
                        {res.detected}/{res.total} blacklists detected
                      </p>
                    )}
                  </div>
                  {!res.error && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-4">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InfoIcon className="cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Status icon</TooltipContent>
                            </Tooltip>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <BlacklistIcon className="inline w-4 h-4 mr-1 text-red-400" />
                              Provider
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <InfoIcon className="cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Blacklist provider</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              Status
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <InfoIcon className="cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>listed, clean or error</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              Message
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <InfoIcon className="cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Provider response message</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              Response
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <InfoIcon className="cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Response time in ms</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              Checked
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <InfoIcon className="cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Timestamp checked</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {res.results.map((r) => (
                          <TableRow
                            key={r.provider}
                            className="cursor-pointer"
                            onClick={() => setDetail(r)}
                          >
                            <TableCell className="pr-2">
                              {r.status === 'listed' ? (
                                <BlacklistIcon className="text-destructive" />
                              ) : r.status === 'error' ? (
                                <WarningIcon className="w-4 h-4" />
                              ) : r.status === 'timeout' ? (
                                <Clock className="w-4 h-4 text-yellow-500" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </TableCell>
                            <TableCell>
                              <BlacklistIcon className="inline w-4 h-4 mr-1 text-red-400" />
                              {r.provider}
                            </TableCell>
                            <TableCell>
                              {r.status === 'listed' ? (
                                <span className="text-destructive">blacklisted</span>
                              ) : r.status === 'error' ? (
                                <span className="text-yellow-500">error</span>
                              ) : r.status === 'timeout' ? (
                                <span className="text-yellow-500">timeout</span>
                              ) : (
                                <span className="text-green-500">clean</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[12rem] truncate">
                              {r.message || '—'}
                            </TableCell>
                            <TableCell>{r.response_time_ms} ms</TableCell>
                            <TableCell>
                              {new Date(r.checked_at).toLocaleTimeString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <BlacklistDetailsDialog 
          detail={detail ? {
            domainOrIp: detail.provider,
            providersChecked: 1,
            resultSummary: detail.status,
            status: detail.status,
            message: detail.message,
            responseTimeMs: detail.response_time_ms,
            checkedAt: detail.checked_at,
            totalBlacklisted: detail.status === 'listed' ? 1 : 0,
            source: detail.provider
          } : null} 
          onClose={() => setDetail(null)} 
        />
      </CardContent>
    </Card>
  );
}
