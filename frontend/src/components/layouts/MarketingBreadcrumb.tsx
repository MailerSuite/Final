/**
 * Marketing Breadcrumb Component
 * Professional breadcrumb navigation with smooth animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface MarketingBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const MarketingBreadcrumb: React.FC<MarketingBreadcrumbProps> = ({
  items,
  className
}) => {
  if (items.length === 0) return null;

  return (
    <nav className={cn("flex", className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {/* Home Link */}
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-muted-foreground transition-colors"
          >
            <HomeIcon className="w-4 h-4" />
          </Link>
        </li>

        {/* Breadcrumb Items */}
        {items.map((item, index) => (
          <motion.li
            key={index}
            className="inline-flex items-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ChevronRightIcon className="w-4 h-4 text-muted-foreground mx-1" />
            {item.href ? (
              <Link
                to={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-muted-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {item.label}
              </span>
            )}
          </motion.li>
        ))}
      </ol>
    </nav>
  );
};

export default MarketingBreadcrumb;