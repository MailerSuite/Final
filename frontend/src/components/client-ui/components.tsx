import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Separator } from './primitives'

export const Panel: React.FC<React.PropsWithChildren<{ title?: string; actions?: React.ReactNode; className?: string }>> = ({ title, actions, className, children }) => {
    return (
        <Card className={className}>
            {(title || actions) && (
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{title}</CardTitle>
                    <div className="flex items-center gap-2">{actions}</div>
                </CardHeader>
            )}
            <CardContent>
                {children}
            </CardContent>
        </Card>
    )
}

interface SectionHeaderProps {
    leading?: React.ReactNode
    title: string
    subtitle?: string
    trailing?: React.ReactNode
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ leading, title, subtitle, trailing }) => {
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
                {leading}
                <div>
                    <div className="text-lg font-semibold">{title}</div>
                    {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
                </div>
            </div>
            <div className="flex items-center gap-2">{trailing}</div>
        </div>
    )
}

interface ToolbarProps {
    children?: React.ReactNode
}

export const Toolbar: React.FC<ToolbarProps> = ({ children }) => {
    return (
        <div className="flex items-center gap-2 py-2">
            {children}
        </div>
    )
}

interface MetricProps {
    label: string
    value: React.ReactNode
    hint?: string
}

export const Metric: React.FC<MetricProps> = ({ label, value, hint }) => {
    return (
        <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-2xl font-semibold leading-tight">{value}</div>
            {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        </div>
    )
}

export const Divider: React.FC = () => <Separator className="my-2" />

