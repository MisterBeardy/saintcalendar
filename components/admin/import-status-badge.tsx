'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  Pause,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ImportStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'
  | 'resumed';

interface ImportStatusBadgeProps {
  status: ImportStatus;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    badgeVariant: 'secondary' as const,
  },
  running: {
    label: 'Running',
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    badgeVariant: 'default' as const,
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    badgeVariant: 'default' as const,
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    badgeVariant: 'destructive' as const,
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    badgeVariant: 'secondary' as const,
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    badgeVariant: 'secondary' as const,
  },
  resumed: {
    label: 'Resumed',
    icon: Play,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    badgeVariant: 'default' as const,
  },
};

export function ImportStatusBadge({
  status,
  className,
  showIcon = true,
  size = 'md'
}: ImportStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge
      variant={config.badgeVariant}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        sizeClasses[size],
        config.bgColor,
        config.borderColor,
        config.color,
        status === 'running' && 'animate-pulse',
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            iconSizes[size],
            status === 'running' && 'animate-spin'
          )}
        />
      )}
      {config.label}
    </Badge>
  );
}

// Utility function to get status color for custom styling
export function getStatusColor(status: ImportStatus): string {
  return statusConfig[status].color;
}

// Utility function to get status background color
export function getStatusBgColor(status: ImportStatus): string {
  return statusConfig[status].bgColor;
}