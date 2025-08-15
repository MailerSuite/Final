import React, { useEffect, useMemo, useState } from 'react'
import PageShell from '../components/PageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/useToast'
import bounceManagementApi, { DeliverabilityStats, SuppressionListEntry } from '@/api/bounce-management-api'
import { ShieldCheckIcon, ExclamationTriangleIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon, ChartBarIcon } from '@heroicons/react/24/outline'

const BounceManagementPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<'suppression' | 'rules' | 'deliverability'>('suppression')
	const [suppression, setSuppression] = useState<SuppressionListEntry[]>([])
	const [loadingSuppression, setLoadingSuppression] = useState(false)
	const [search, setSearch] = useState('')
	const [typeFilter, setTypeFilter] = useState<string>('all')
	const [deliverability, setDeliverability] = useState<DeliverabilityStats[]>([])
	const [loadingDeliverability, setLoadingDeliverability] = useState(false)

	const filteredSuppression = useMemo(() => {
		return suppression.filter((e) => {
			const matchesSearch = !search || e.email_address.toLowerCase().includes(search.toLowerCase())
			const matchesType = typeFilter === 'all' || e.suppression_type === typeFilter
			return matchesSearch && matchesType
		})
	}, [suppression, search, typeFilter])

	useEffect(() => {
		const load = async () => {
			try {
				setLoadingSuppression(true)
				const entries = await bounceManagementApi.getSuppressionList({ limit: 500 })
				setSuppression(entries)
			} catch (e: unknown) {
				toast.error?.(e?.message || 'Failed to load suppression list')
			} finally {
				setLoadingSuppression(false)
			}
		}
		void load()
	}, [])

	useEffect(() => {
		const load = async () => {
			try {
				setLoadingDeliverability(true)
				const stats = await bounceManagementApi.getDeliverabilityStats(25)
				setDeliverability(stats)
			} catch (e: unknown) {
				toast.error?.(e?.message || 'Failed to load deliverability stats')
			} finally {
				setLoadingDeliverability(false)
			}
		}
		void load()
	}, [])

	return (
		<PageShell
			title="Bounce Management"
			subtitle="Manage bounces, suppression, and monitor deliverability"
			breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Compliance' }, { label: 'Bounce Management' }]}
		>
			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-4">
				<TabsList>
					<TabsTrigger value="suppression">Suppression List</TabsTrigger>
					<TabsTrigger value="rules">Bounce Rules</TabsTrigger>
					<TabsTrigger value="deliverability">Deliverability</TabsTrigger>
				</TabsList>

				<TabsContent value="suppression" className="space-y-4">
					<Card>
						<CardHeader className="flex items-center justify-between">
							<CardTitle>Suppression List</CardTitle>
							<div className="flex items-center gap-2">
								<div className="relative">
									<MagnifyingGlassIcon className="w-4 h-4 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
									<Input placeholder="Search email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-64" />
								</div>
								<Select value={typeFilter} onValueChange={setTypeFilter}>
									<SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All</SelectItem>
										<SelectItem value="bounce">Bounce</SelectItem>
										<SelectItem value="unsubscribe">Unsubscribe</SelectItem>
										<SelectItem value="complaint">Complaint</SelectItem>
										<SelectItem value="manual">Manual</SelectItem>
										<SelectItem value="gdpr">GDPR</SelectItem>
									</SelectContent>
								</Select>
								<Button variant="outline" onClick={async () => {
									try {
										const emails = filteredSuppression.map((e) => e.email_address)
										await bounceManagementApi.bulkRemoveFromSuppression(emails)
										toast.success?.('Removed selected emails from suppression')
									} catch (e: unknown) {
										toast.error?.(e?.message || 'Bulk remove failed')
									}
								}}>Bulk Remove</Button>
							</div>
						</CardHeader>
						<CardContent>
							{loadingSuppression ? (
								<div className="text-sm text-muted-foreground">Loading…</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Email</TableHead>
											<TableHead>Type</TableHead>
											<TableHead>Reason</TableHead>
											<TableHead>Added</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredSuppression.map((e) => (
											<TableRow key={`${e.email_address}-${e.added_at}`}>
												<TableCell className="font-medium">{e.email_address}</TableCell>
												<TableCell>
													<Badge variant={e.suppression_type === 'bounce' || e.suppression_type === 'complaint' ? 'destructive' : e.suppression_type === 'unsubscribe' ? 'secondary' : 'outline'}>
														{e.suppression_type}
													</Badge>
												</TableCell>
												<TableCell className="text-muted-foreground text-sm">{e.reason || '-'}</TableCell>
												<TableCell className="text-muted-foreground text-sm">{new Date(e.added_at).toLocaleString()}</TableCell>
												<TableCell className="text-right">
													<Button size="icon" variant="outline" onClick={async () => {
														try {
															await bounceManagementApi.removeFromSuppression(e.email_address)
															setSuppression((prev) => prev.filter((x) => x.email_address !== e.email_address))
															toast.success?.('Removed from suppression')
														} catch (err: unknown) {
															toast.error?.(err?.message || 'Remove failed')
														}
													}}>
														<TrashIcon className="w-4 h-4" />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="rules" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Bounce Rules</CardTitle>
						</CardHeader>
						<CardContent>
							<Alert>
								<AlertDescription className="text-sm">
									Rule editing UI is coming soon. Existing rules are applied on the backend.
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="deliverability" className="space-y-4">
					<Card>
						<CardHeader className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2"><ChartBarIcon className="w-5 h-5" /> Domain Deliverability</CardTitle>
							<div className="flex items-center gap-2">
								<Button variant="outline" onClick={() => window.open('/deliverability', '_self')}>
									<ShieldCheckIcon className="w-4 h-4 mr-2" /> Open Full Dashboard
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{loadingDeliverability ? (
								<div className="text-sm text-muted-foreground">Loading…</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Domain</TableHead>
											<TableHead>Bounce Rate</TableHead>
											<TableHead>Hard/Soft</TableHead>
											<TableHead>Reputation Issues</TableHead>
											<TableHead>Last Updated</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{deliverability.map((d) => (
											<TableRow key={d.domain}>
												<TableCell className="font-medium">{d.domain}</TableCell>
												<TableCell>{(d.bounce_rate || 0).toFixed(2)}%</TableCell>
												<TableCell>{d.hard_bounces}/{d.soft_bounces}</TableCell>
												<TableCell>{d.reputation_issues}</TableCell>
												<TableCell className="text-muted-foreground text-sm">{d.last_updated ? new Date(d.last_updated).toLocaleString() : '-'}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</PageShell>
	)
}

export default BounceManagementPage