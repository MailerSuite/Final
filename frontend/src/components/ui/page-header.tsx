import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader = ({ title, description, icon, breadcrumbs = [], actions, className }: PageHeaderProps) => (
  <div className={cn("mb-6 space-y-2", className)}>
    {breadcrumbs.length > 0 && (
      <nav aria-label="Breadcrumb" className="-mb-1">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <li key={`${crumb.label}-${index}`} className="inline-flex items-center gap-2">
              {crumb.href ? (
                <Link to={crumb.href} className="hover:text-foreground focus:outline-none focus:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-foreground font-medium">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && <span className="opacity-60">/</span>}
            </li>
          ))}
        </ol>
      </nav>
    )}

    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
        </div>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  </div>
);

export default PageHeader;
