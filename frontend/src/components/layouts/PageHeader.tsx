import React from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
    compact?: boolean;
    children?: React.ReactNode;
};

export const PageHeader: React.FC<PageHeaderProps> = ({ 
    title, 
    description, 
    actions, 
    icon, 
    className,
    compact = false,
    children 
}) => {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                                {icon}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <h1 className={cn(
                                "font-bold tracking-tight text-foreground",
                                compact ? "text-2xl" : "text-3xl"
                            )}>
                                {title}
                            </h1>
                            {description && (
                                <p className="text-muted-foreground mt-1">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {actions && (
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap" aria-label="Page actions">
                        {actions}
                    </div>
                )}
            </div>
            
            {children && (
                <div className="border-b border-border pb-4">
                    {children}
                </div>
            )}
        </div>
    );
};

export default PageHeader;

