'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const progressVariants = {
  default: 'bg-primary',
  destructive: 'bg-destructive',
}

const progressSizes = {
  default: 'h-2',
  sm: 'h-1.5',
  lg: 'h-4',
}

const Progress = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & {
    value?: number
    indicatorClassName?: string
  }
>(
  (
    {
      className,
      value,
      indicatorClassName,
      size = 'default',
      variant = 'default',
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
        progressSizes[size],
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-full w-full flex-1 bg-background transition-all',
          progressVariants[variant],
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  ),
)
Progress.displayName = 'Progress'

export { Progress }