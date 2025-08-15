/**
 * @deprecated Use the protected loader system instead: @/core/loaders
 * This component now redirects to the protected LoadingSkeleton
 */
import React from 'react';
import { LoadingSkeleton as ProtectedLoadingSkeleton } from "@/core/loaders";
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingSkeleton(props: React.ComponentProps<typeof Skeleton>) {
  return <ProtectedLoadingSkeleton {...props} />;
}
