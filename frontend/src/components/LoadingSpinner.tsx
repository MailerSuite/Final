/**
 * @deprecated Use the protected loader system instead: @/core/loaders
 * This component now redirects to the protected LoadingSpinner
 */
import React from 'react';
import { LoadingSpinner as ProtectedLoadingSpinner } from "@/core/loaders";

export default function LoadingSpinner(props: React.HTMLAttributes<HTMLDivElement> & { size?: string }) {
  return <ProtectedLoadingSpinner {...props} />;
}
