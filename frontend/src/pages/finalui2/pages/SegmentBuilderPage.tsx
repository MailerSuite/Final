import React, { useState, useCallback } from 'react'
import PageShell from '../components/PageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/useToast'
import {
    PlusIcon,
    TrashIcon,
    SparklesIcon,
    UserGroupIcon,
    ChartBarIcon,
    LightBulbIcon,
    BeakerIcon
} from '@heroicons/react/24/outline'

interface SegmentCondition {
    id: string
    field: string
    operator: string
    value: string | number | boolean
    logicalOperator: 'AND' | 'OR'
    groupId: number
}

interface Segment {
    id: string
    name: string
    description: string
    conditions: SegmentCondition[]
    isActive: boolean
    isDynamic: boolean
    estimatedSize: number
    lastCalculated?: string
}

const SegmentBuilderPage: React.FC = () => {
    const [segments, setSegments] = useState<Segment[]>([])
    const [currentSegment, setCurrentSegment] = useState<Segment | null>(null)
    const [showCreate, setShowCreate] = useState(false)
    const [aiSuggestion, setAiSuggestion] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [mlRecommendations, setMlRecommendations] = useState<Array<{
        id: string
        name: string
        description: string
        confidence: number
        estimatedSize: number
        reasoning: string
        conditions: SegmentCondition[]
    }>>([])
    const [behavioralData, setBehavioralData] = useState<Array<{
        metric: string
        value: number
        trend: 'up' | 'down' | 'stable'
        segment: string
    }>>([])
    const [predictiveInsights, setPredictiveInsights] = useState<Array<{
        insight: string
        confidence: number
        action: string
        impact: 'high' | 'medium' | 'low'
    }>>([])

    const availableFields = [
        { value: 'email', label: 'Email Domain', type: 'string' },
        { value: 'first_name', label: 'First Name', type: 'string' },
        { value: 'last_name', label: 'Last Name', type: 'string' },
        { value: 'company', label: 'Company', type: 'string' },
        { value: 'industry', label: 'Industry', type: 'string' },
        { value: 'location', label: 'Location', type: 'string' },
        { value: 'engagement_score', label: 'Engagement Score', type: 'number' },
        { value: 'last_contacted', label: 'Last Contacted', type: 'date' },
        { value: 'bounce_count', label: 'Bounce Count', type: 'number' },
        { value: 'tags', label: 'Tags', type: 'array' }
    ]

    const operators = {
        string: [
            { value: 'equals', label: 'Equals' },
            { value: 'contains', label: 'Contains' },
            { value: 'starts_with', label: 'Starts with' },
            { value: 'ends_with', label: 'Ends with' },
            { value: 'is_empty', label: 'Is empty' },
            { value: 'is_not_empty', label: 'Is not empty' }
        ],
        number: [
            { value: 'equals', label: 'Equals' },
            { value: 'greater_than', label: 'Greater than' },
            { value: 'less_than', label: 'Less than' },
            { value: 'between', label: 'Between' },
            { value: 'is_empty', label: 'Is empty' }
        ],
        date: [
            { value: 'equals', label: 'Equals' },
            { value: 'before', label: 'Before' },
            { value: 'after', label: 'After' },
            { value: 'in_last_days', label: 'In last X days' },
            { value: 'not_contacted_in', label: 'Not contacted in X days' }
        ],
        array: [
            { value: 'contains', label: 'Contains' },
            { value: 'not_contains', label: 'Does not contain' },
            { value: 'is_empty', label: 'Is empty' }
        ]
    }

    const addCondition = useCallback((segmentId: string) => {
        setSegments(prev => prev.map(seg => {
            if (seg.id === segmentId) {
                const newCondition: SegmentCondition = {
                    id: `cond_${Date.now()}`,
                    field: 'email',
                    operator: 'contains',
                    value: '',
                    logicalOperator: 'AND',
                    groupId: seg.conditions.length
                }
                return { ...seg, conditions: [...seg.conditions, newCondition] }
            }
            return seg
        }))
    }, [])

    const removeCondition = useCallback((segmentId: string, conditionId: string) => {
        setSegments(prev => prev.map(seg => {
            if (seg.id === segmentId) {
                return { ...seg, conditions: seg.conditions.filter(c => c.id !== conditionId) }
            }
            return seg
        }))
    }, [])

    const updateCondition = useCallback((segmentId: string, conditionId: string, updates: Partial<SegmentCondition>) => {
        setSegments(prev => prev.map(seg => {
            if (seg.id === segmentId) {
                return {
                    ...seg,
                    conditions: seg.conditions.map(c => c.id === conditionId ? { ...c, ...updates } : c)
                }
            }
            return seg
        }))
    }, [])

    const generateAiSuggestion = useCallback(async () => {
        setIsGenerating(true)
        try {
            // Enhanced AI generation with ML insights
            await new Promise(resolve => setTimeout(resolve, 3000))
            
            const suggestions = [
                'Based on your description, I recommend creating a segment for "High-Value Customers" with conditions: Engagement Score > 80, Last Purchase within 30 days, and Email Domain from corporate domains.',
                'Consider a "Re-engagement Campaign" segment: Inactive for 60+ days but previously engaged, with personalized content to re-engage.',
                'Create a "Product Interest" segment based on browsing behavior and purchase history for targeted product recommendations.'
            ]
            
            setAiSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)])
            
            // Generate ML recommendations
            const recommendations = [
                {
                    id: '1',
                    name: 'High-Value Prospects',
                    description: 'Users with high engagement but no purchase yet',
                    confidence: 0.89,
                    estimatedSize: 1250,
                    reasoning: 'ML analysis shows 89% of users with engagement score >75 convert within 30 days',
                    conditions: [
                        { id: '1', field: 'Engagement Score', operator: 'Greater than', value: 75, logicalOperator: 'AND', groupId: 1 },
                        { id: '2', field: 'Purchase History', operator: 'Equals', value: 'None', logicalOperator: 'AND', groupId: 1 }
                    ]
                },
                {
                    id: '2',
                    name: 'At-Risk Customers',
                    description: 'Customers showing declining engagement patterns',
                    confidence: 0.76,
                    estimatedSize: 890,
                    reasoning: 'Behavioral analysis indicates 76% of users with declining engagement churn within 60 days',
                    conditions: [
                        { id: '3', field: 'Engagement Trend', operator: 'Equals', value: 'Declining', logicalOperator: 'AND', groupId: 1 },
                        { id: '4', field: 'Last Activity', operator: 'Less than', value: '30 days ago', logicalOperator: 'AND', groupId: 1 }
                    ]
                },
                {
                    id: '3',
                    name: 'Product Advocates',
                    description: 'Highly satisfied customers likely to refer others',
                    confidence: 0.92,
                    estimatedSize: 2100,
                    reasoning: 'Sentiment analysis shows 92% of users with satisfaction score >8.5 refer 2+ new customers',
                    conditions: [
                        { id: '5', field: 'Satisfaction Score', operator: 'Greater than', value: 8.5, logicalOperator: 'AND', groupId: 1 },
                        { id: '6', field: 'Referral History', operator: 'Greater than', value: 0, logicalOperator: 'AND', groupId: 1 }
                    ]
                }
            ]
            
            setMlRecommendations(recommendations)
            
            // Generate behavioral insights
            const behavioral = [
                { metric: 'Open Rate', value: 24.5, trend: 'up', segment: 'Product Interest' },
                { metric: 'Click Rate', value: 8.2, trend: 'stable', segment: 'High Engagement' },
                { metric: 'Conversion Rate', value: 3.1, trend: 'down', segment: 'At-Risk' },
                { metric: 'Revenue per Email', value: 2.45, trend: 'up', segment: 'High-Value' }
            ]
            
            setBehavioralData(behavioral)
            
            // Generate predictive insights
            const insights = [
                {
                    insight: 'Segment "High-Value Prospects" shows 23% higher conversion potential',
                    confidence: 0.87,
                    action: 'Prioritize this segment for premium content campaigns',
                    impact: 'high'
                },
                {
                    insight: 'Users with "Product Interest" + "High Engagement" have 3.2x higher lifetime value',
                    confidence: 0.79,
                    action: 'Create cross-selling campaigns for this segment',
                    impact: 'medium'
                },
                {
                    insight: 'At-risk customers respond 40% better to re-engagement campaigns',
                    confidence: 0.82,
                    action: 'Implement win-back strategy within 30 days',
                    impact: 'high'
                }
            ]
            
            setPredictiveInsights(insights)
            
        } catch (error) {
            console.error('Failed to generate AI suggestion:', error)
        } finally {
            setIsGenerating(false)
        }
    }, [currentSegment?.description])

    const applyMlRecommendation = useCallback((recommendation: typeof mlRecommendations[0]) => {
        if (currentSegment) {
            setCurrentSegment({
                ...currentSegment,
                name: recommendation.name,
                description: recommendation.description,
                conditions: recommendation.conditions
            })
            toast.success?.(`Applied ML recommendation: ${recommendation.name}`)
        }
    }, [currentSegment])

    const createSegment = useCallback(() => {
        if (!currentSegment?.name.trim()) {
            toast.error?.('Segment name is required')
            return
        }

        const newSegment: Segment = {
            ...currentSegment,
            id: `seg_${Date.now()}`,
            estimatedSize: Math.floor(Math.random() * 5000) + 100,
            lastCalculated: new Date().toISOString()
        }

        setSegments(prev => [...prev, newSegment])
        setCurrentSegment(null)
        setShowCreate(false)
        toast.success?.('Segment created successfully')
    }, [currentSegment])

    const getFieldType = (fieldValue: string) => {
        return availableFields.find(f => f.value === fieldValue)?.type || 'string'
    }

    return (
        <PageShell title="Segment Builder" subtitle="Create AI-powered audience segments">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Segment List */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserGroupIcon className="w-5 h-5" />
                                Segments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => setShowCreate(true)}
                                className="w-full mb-4"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Create Segment
                            </Button>

                            <div className="space-y-2">
                                {segments.map(segment => (
                                    <div
                                        key={segment.id}
                                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                        onClick={() => setCurrentSegment(segment)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium">{segment.name}</h4>
                                            <Badge variant={segment.isActive ? 'default' : 'secondary'}>
                                                {segment.isActive ? 'Active' : 'Draft'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">{segment.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>{segment.conditions.length} conditions</span>
                                            <span>~{segment.estimatedSize.toLocaleString()} users</span>
                                        </div>
                                    </div>
                                ))}

                                {segments.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <UserGroupIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No segments created yet</p>
                                        <p className="text-sm">Create your first segment to get started</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Segment Editor */}
                <div className="lg:col-span-2 space-y-4">
                    {showCreate && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5 text-primary" />
                                    Create New Segment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Segment Name</Label>
                                        <Input
                                            placeholder="e.g., High-Value Prospects"
                                            value={currentSegment?.name || ''}
                                            onChange={(e) => setCurrentSegment(prev => ({ ...prev!, name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Input
                                            placeholder="Describe your target audience"
                                            value={currentSegment?.description || ''}
                                            onChange={(e) => setCurrentSegment(prev => ({ ...prev!, description: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {/* AI Suggestion */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Label>AI-Powered Suggestion</Label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={generateAiSuggestion}
                                            disabled={isGenerating}
                                        >
                                            <LightBulbIcon className="w-4 h-4 mr-1" />
                                            {isGenerating ? 'Generating...' : 'Get Suggestion'}
                                        </Button>
                                    </div>
                                    {aiSuggestion && (
                                        <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                                            <p className="text-sm">{aiSuggestion}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Segment Options */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="flex items-center gap-2">
                                        <Switch
                                            checked={currentSegment?.isActive || false}
                                            onCheckedChange={(checked) => setCurrentSegment(prev => ({ ...prev!, isActive: checked }))}
                                        />
                                        <span className="text-sm">Active segment</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <Switch
                                            checked={currentSegment?.isDynamic || false}
                                            onCheckedChange={(checked) => setCurrentSegment(prev => ({ ...prev!, isDynamic: checked }))}
                                        />
                                        <span className="text-sm">Dynamic (auto-update)</span>
                                    </label>
                                </div>

                                {/* Conditions */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Segment Conditions</Label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addCondition('new')}
                                        >
                                            <PlusIcon className="w-4 h-4 mr-1" />
                                            Add Condition
                                        </Button>
                                    </div>

                                    {currentSegment?.conditions.map((condition, index) => (
                                        <div key={condition.id} className="p-4 border rounded-lg space-y-3">
                                            <div className="flex items-center gap-2">
                                                {index > 0 && (
                                                    <Select
                                                        value={condition.logicalOperator}
                                                        onValueChange={(value: 'AND' | 'OR') => updateCondition('new', condition.id, { logicalOperator: value })}
                                                    >
                                                        <SelectTrigger className="w-20">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="AND">AND</SelectItem>
                                                            <SelectItem value="OR">OR</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}

                                                <Select
                                                    value={condition.field}
                                                    onValueChange={(value) => updateCondition('new', condition.id, { field: value })}
                                                >
                                                    <SelectTrigger className="w-40">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableFields.map(field => (
                                                            <SelectItem key={field.value} value={field.value}>
                                                                {field.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Select
                                                    value={condition.operator}
                                                    onValueChange={(value) => updateCondition('new', condition.id, { operator: value })}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {operators[getFieldType(condition.field) as keyof typeof operators]?.map(op => (
                                                            <SelectItem key={op.value} value={op.value}>
                                                                {op.value}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Input
                                                    placeholder="Value"
                                                    value={condition.value as string}
                                                    onChange={(e) => updateCondition('new', condition.id, { value: e.target.value })}
                                                    className="flex-1"
                                                />

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeCondition('new', condition.id)}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {(!currentSegment?.conditions || currentSegment.conditions.length === 0) && (
                                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                            <BeakerIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>No conditions defined</p>
                                            <p className="text-sm">Add conditions to define your target audience</p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowCreate(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={createSegment}>
                                        Create Segment
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {currentSegment && !showCreate && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ChartBarIcon className="w-5 h-5" />
                                    {currentSegment.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <p className="text-muted-foreground">{currentSegment.description}</p>

                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-3 bg-muted/50 rounded-lg">
                                            <div className="text-2xl font-bold">{currentSegment.conditions.length}</div>
                                            <div className="text-sm text-muted-foreground">Conditions</div>
                                        </div>
                                        <div className="p-3 bg-muted/50 rounded-lg">
                                            <div className="text-2xl font-bold">~{currentSegment.estimatedSize.toLocaleString()}</div>
                                            <div className="text-sm text-muted-foreground">Estimated Size</div>
                                        </div>
                                        <div className="p-3 bg-muted/50 rounded-lg">
                                            <div className="text-2xl font-bold">{currentSegment.isActive ? 'Active' : 'Draft'}</div>
                                            <div className="text-sm text-muted-foreground">Status</div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <h4 className="font-medium">Conditions</h4>
                                        {currentSegment.conditions.map((condition, index) => (
                                            <div key={condition.id} className="flex items-center gap-2 text-sm">
                                                {index > 0 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {condition.logicalOperator}
                                                    </Badge>
                                                )}
                                                <span className="font-medium">{availableFields.find(f => f.value === condition.field)?.label}</span>
                                                <span className="text-muted-foreground">
                                                    {operators[getFieldType(condition.field) as keyof typeof operators]?.find(op => op.value === condition.operator)?.label}
                                                </span>
                                                <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                                                    {condition.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </PageShell>
    )
}

export default SegmentBuilderPage 