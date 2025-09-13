import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface PendingChangeBadgeProps {
  onClick?: () => void;
  className?: string;
}

export function PendingChangeBadge({ onClick, className = '' }: PendingChangeBadgeProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`h-auto p-1 hover:bg-orange-50 ${className}`}
      aria-label="View pending changes for this item"
      title="Pending changes available - click to view"
    >
      <Badge
        variant="secondary"
        className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 text-xs px-2 py-0.5 flex items-center gap-1"
      >
        <Clock className="h-3 w-3" />
        Pending Change
      </Badge>
    </Button>
  );
}