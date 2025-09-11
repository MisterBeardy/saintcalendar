'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  FileText,
  Users,
  MapPin
} from 'lucide-react';
import { ImportStatusBadge, ImportStatus } from './import-status-badge';
import { cn } from '@/lib/utils';

export interface ImportProgress {
  importId: string;
  status: ImportStatus;
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  recordsProcessed: number;
  totalRecords: number;
  errors: number;
  warnings: number;
  startTime: string;
  estimatedTimeRemaining?: number;
  currentOperation?: string;
  speed?: number; // records per second
}

interface ImportProgressTrackerProps {
  importId?: string;
  className?: string;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRetry?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ImportProgressTracker({
  importId,
  className,
  onCancel,
  onPause,
  onResume,
  onRetry,
  autoRefresh = true,
  refreshInterval = 2000, // 2 seconds
}: ImportProgressTrackerProps) {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch progress data
  const fetchProgress = useCallback(async () => {
    if (!importId) return;

    try {
      const response = await fetch(`/api/imports/${importId}/progress`);
      if (!response.ok) {
        throw new Error('Failed to fetch import progress');
      }
      const data: ImportProgress = await response.json();
      setProgress(data);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [importId]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !importId) return;

    const interval = setInterval(fetchProgress, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, importId, refreshInterval, fetchProgress]);

  // Initial fetch
  useEffect(() => {
    if (importId) {
      fetchProgress();
    }
  }, [importId, fetchProgress]);

  // WebSocket connection for real-time updates (placeholder for future implementation)
  useEffect(() => {
    if (!importId) return;

    // TODO: Implement WebSocket connection for real-time updates
    // const ws = new WebSocket(`/api/imports/${importId}/ws`);
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   setProgress(data);
    //   setLastUpdate(new Date());
    // };

    return () => {
      // ws.close();
    };
  }, [importId]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTimeRemaining = (seconds?: number) => {
    if (!seconds) return 'Calculating...';
    return formatDuration(seconds);
  };

  const getElapsedTime = () => {
    if (!progress?.startTime) return 0;
    const start = new Date(progress.startTime);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / 1000);
  };

  const getProgressStats = () => {
    if (!progress) return null;

    const elapsed = getElapsedTime();
    const rate = elapsed > 0 ? progress.recordsProcessed / elapsed : 0;

    return {
      elapsed: formatDuration(elapsed),
      rate: Math.round(rate * 100) / 100,
      remaining: progress.estimatedTimeRemaining,
    };
  };

  if (loading && !progress) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 animate-spin" />
            <span>Loading import progress...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !progress) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load import progress: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2" />
            <p>No active import found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = getProgressStats();

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Import Progress</CardTitle>
            <ImportStatusBadge status={progress.status} />
          </div>
          <div className="flex items-center gap-2">
            {progress.status === 'running' && onPause && (
              <Button variant="outline" size="sm" onClick={onPause}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            {progress.status === 'paused' && onResume && (
              <Button variant="outline" size="sm" onClick={onResume}>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
            {(progress.status === 'running' || progress.status === 'paused') && onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                <Square className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            {progress.status === 'failed' && onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="h-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {progress.currentStep} of {progress.totalSteps}</span>
            {progress.currentOperation && (
              <span>{progress.currentOperation}</span>
            )}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {progress.recordsProcessed.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Records Processed
            </div>
            {progress.totalRecords > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                of {progress.totalRecords.toLocaleString()}
              </div>
            )}
          </div>

          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats?.rate || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Records/sec
            </div>
          </div>

          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {progress.errors}
            </div>
            <div className="text-sm text-muted-foreground">
              Errors
            </div>
          </div>

          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {progress.warnings}
            </div>
            <div className="text-sm text-muted-foreground">
              Warnings
            </div>
          </div>
        </div>

        {/* Time Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Elapsed Time</div>
              <div className="text-muted-foreground">{stats?.elapsed || '0s'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Time Remaining</div>
              <div className="text-muted-foreground">
                {formatTimeRemaining(stats?.remaining)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Last Updated</div>
              <div className="text-muted-foreground">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>
        </div>

        {/* Error/Warning Alerts */}
        {(progress.errors > 0 || progress.warnings > 0) && (
          <div className="space-y-2">
            {progress.errors > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {progress.errors} error{progress.errors !== 1 ? 's' : ''} encountered during import
                </AlertDescription>
              </Alert>
            )}
            {progress.warnings > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {progress.warnings} warning{progress.warnings !== 1 ? 's' : ''} generated during import
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}