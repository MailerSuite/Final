/**
 * Streamlined Design Example
 * This component demonstrates the recommended design patterns from the audit
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Design tokens following the audit recommendations
export const streamlinedTokens = {
    spacing: {
        xs: 'space-y-1',
        sm: 'space-y-2',
        md: 'space-y-4',
        lg: 'space-y-6',
        xl: 'space-y-8',
    },
    animation: {
        subtle: 'transition-all duration-300 ease-in-out',
        hover: 'hover:scale-[1.02] hover:shadow-lg',
    },
    colors: {
        primary: 'bg-blue-600 hover:bg-blue-700',
        success: 'bg-green-600 hover:bg-green-700',
        warning: 'bg-amber-600 hover:bg-amber-700',
        error: 'bg-red-600 hover:bg-red-700',
    }
};

// Example of streamlined card component
export const StreamlinedCard: React.FC<{
    title: string;
    description?: string;
    metric?: { value: string | number; label: string; trend?: 'up' | 'down' | 'stable' };
    variant?: 'primary' | 'secondary' | 'elevated';
    children?: React.ReactNode;
}> = ({ title, description, metric, variant = 'primary', children }) => {
    const cardVariants = {
        primary: 'border-primary/20 shadow-sm',
        secondary: 'border-border/50',
        elevated: 'shadow-lg border-0',
    };

    return (
        <Card className={cn(
            streamlinedTokens.animation.subtle,
            streamlinedTokens.animation.hover,
            cardVariants[variant]
        )}>
            <CardHeader className="space-y-1">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg font-medium">{title}</CardTitle>
                        {description && (
                            <CardDescription className="text-sm text-muted-foreground mt-1">
                                {description}
                            </CardDescription>
                        )}
                    </div>
                    {metric && (
                        <div className="text-right">
                            <div className="text-2xl font-semibold">{metric.value}</div>
                            <div className="text-xs text-muted-foreground">{metric.label}</div>
                        </div>
                    )}
                </div>
            </CardHeader>
            {children && <CardContent>{children}</CardContent>}
        </Card>
    );
};

// Example of streamlined page layout
export const StreamlinedPageLayout: React.FC<{
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, description, actions, children }) => {
    return (
        <div className="min-h-screen bg-background">
            {/* Clean header with consistent spacing */}
            <div className="border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                            {description && (
                                <p className="text-muted-foreground mt-1">{description}</p>
                            )}
                        </div>
                        {actions && <div className="flex gap-2">{actions}</div>}
                    </div>
                </div>
            </div>

            {/* Content area with consistent padding */}
            <div className="container mx-auto px-4 py-8">
                {children}
            </div>
        </div>
    );
};

// Example of streamlined dashboard
export const StreamlinedDashboardExample: React.FC = () => {
    return (
        <StreamlinedPageLayout
            title="Dashboard"
            description="Overview of your account performance"
            actions={
                <>
                    <Button variant="outline">Export</Button>
                    <Button className={streamlinedTokens.colors.primary}>
                        Create Campaign
                    </Button>
                </>
            }
        >
            {/* Metrics row with consistent spacing */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StreamlinedCard
                    title="Total Emails"
                    metric={{ value: '12.5K', label: 'This month', trend: 'up' }}
                    variant="primary"
                />
                <StreamlinedCard
                    title="Delivery Rate"
                    metric={{ value: '94.2%', label: 'Average', trend: 'stable' }}
                    variant="primary"
                />
                <StreamlinedCard
                    title="Open Rate"
                    metric={{ value: '28.7%', label: 'Average', trend: 'up' }}
                    variant="primary"
                />
                <StreamlinedCard
                    title="Click Rate"
                    metric={{ value: '3.2%', label: 'Average', trend: 'down' }}
                    variant="primary"
                />
            </div>

            {/* Content sections with clear hierarchy */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <StreamlinedCard
                        title="Recent Campaigns"
                        description="Your latest email campaigns and their performance"
                        variant="elevated"
                    >
                        <div className="space-y-3">
                            {['Welcome Series', 'Product Launch', 'Newsletter #42'].map((campaign) => (
                                <div key={campaign} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div>
                                        <div className="font-medium">{campaign}</div>
                                        <div className="text-sm text-muted-foreground">Sent 2 hours ago</div>
                                    </div>
                                    <Badge variant="secondary">Active</Badge>
                                </div>
                            ))}
                        </div>
                    </StreamlinedCard>
                </div>

                <div className="space-y-6">
                    <StreamlinedCard
                        title="Quick Actions"
                        variant="secondary"
                    >
                        <div className="space-y-2">
                            <Button className="w-full justify-start" variant="ghost">
                                Create Campaign
                            </Button>
                            <Button className="w-full justify-start" variant="ghost">
                                Import Contacts
                            </Button>
                            <Button className="w-full justify-start" variant="ghost">
                                View Analytics
                            </Button>
                        </div>
                    </StreamlinedCard>

                    <StreamlinedCard
                        title="System Health"
                        variant="secondary"
                    >
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Server Load</span>
                                    <span>68%</span>
                                </div>
                                <Progress value={68} className="h-2" />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Storage</span>
                                    <span>45%</span>
                                </div>
                                <Progress value={45} className="h-2" />
                            </div>
                        </div>
                    </StreamlinedCard>
                </div>
            </div>
        </StreamlinedPageLayout>
    );
};

// Example of streamlined form
export const StreamlinedFormExample: React.FC = () => {
    return (
        <div className="max-w-md mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Create Campaign</CardTitle>
                    <CardDescription>
                        Set up a new email campaign in just a few steps
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Campaign Name</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder="Enter campaign name"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Subject Line</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder="Enter email subject"
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" className="flex-1">Cancel</Button>
                        <Button className={cn("flex-1", streamlinedTokens.colors.primary)}>
                            Create Campaign
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
