import React from 'react';
import { Button } from '@/components/ui/button';

interface HeroCTAProps {
  primaryText: string;
  secondaryText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export const HeroCTA: React.FC<HeroCTAProps> = ({
  primaryText,
  secondaryText,
  onPrimaryClick,
  onSecondaryClick,
}) => {
  return (
    <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-3">
      <Button onClick={onPrimaryClick} className="bg-red-600 hover:bg-red-500">
        {primaryText}
      </Button>
      {secondaryText && (
        <Button variant="outline" onClick={onSecondaryClick}>
          {secondaryText}
        </Button>
      )}
    </div>
  );
};