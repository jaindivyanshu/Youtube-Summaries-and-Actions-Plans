'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

export function LoadingSpinner({ size = 'md', className, message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-5 w-5', // Adjusted for smaller contexts
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn("flex flex-col justify-center items-center space-y-2", className)}>
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
