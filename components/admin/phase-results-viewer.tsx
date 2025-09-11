'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Database,
  BarChart3,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PhaseResultData {
  phaseId: string;
  phaseName: string;
  status: 'success' | 'warning' | 'error';
  summary: string;
  timestamp: string;
  duration: number;
  data: {
    [key: string]: any;
  };
  logs?: Array<{
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
  }>;
  errors?: Array<{
    type: string;
    message: string;
    details?: any;
  }>;
}

interface PhaseResultsViewerProps {
  results: PhaseResultData[];
  className?: string;
}

const phaseIcons = {
  scan: FileText,
  locations: Database,
  verify: CheckCircle,
  count: BarChart3,
  import: Upload,
};

const statusConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

export function PhaseResultsViewer({ results, className }: PhaseResultsViewerProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [showLogs, setShowLogs] = useState<Set<string>>(new Set());

  const toggleExpanded = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const toggleLogs = (phaseId: string) => {
    const newShowLogs = new Set(showLogs);
    if (newShowLogs.has(phaseId)) {
      newShowLogs.delete(phaseId);
    } else {
      newShowLogs.add(phaseId);
    }
    setShowLogs(newShowLogs);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const renderPhaseSummary = (result: PhaseResultData) => {
    const PhaseIcon = phaseIcons[result.phaseId as keyof typeof phaseIcons] || Info;
    const status = statusConfig[result.status];

    return (
      <Card key={result.phaseId} className={cn('transition-all duration-200', className)}>
        <CardHeader
          className={cn(
            'cursor-pointer hover:bg-muted/50 transition-colors',
            status.bgColor,
            status.borderColor
          )}
          onClick={() => toggleExpanded(result.phaseId)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PhaseIcon className={cn('h-5 w-5', status.color)} />
              <div>
                <CardTitle className="text-lg">{result.phaseName}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Completed in {formatDuration(result.duration)} • {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={result.status === 'success' ? 'default' : result.status === 'warning' ? 'secondary' : 'destructive'}>
                {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
              </Badge>
              {expandedPhases.has(result.phaseId) ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </CardHeader>

        {expandedPhases.has(result.phaseId) && (
          <CardContent className="pt-0">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="logs" disabled={!result.logs?.length}>
                  Logs ({result.logs?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="errors" disabled={!result.errors?.length}>
                  Errors ({result.errors?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <Alert className={cn(status.bgColor, status.borderColor)}>
                  <status.icon className={cn('h-4 w-4', status.color)} />
                  <AlertDescription className={status.color}>
                    {result.summary}
                  </AlertDescription>
                </Alert>

                {renderPhaseSpecificSummary(result)}
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Phase Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Phase ID:</span>
                        <span className="text-sm font-mono">{result.phaseId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Duration:</span>
                        <span className="text-sm">{formatDuration(result.duration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Completed:</span>
                        <span className="text-sm">{new Date(result.timestamp).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Data Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="logs" className="space-y-4">
                {result.logs && result.logs.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Execution Logs</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleLogs(result.phaseId)}
                      >
                        {showLogs.has(result.phaseId) ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide Logs
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Show Logs
                          </>
                        )}
                      </Button>
                    </div>

                    {showLogs.has(result.phaseId) && (
                      <div className="bg-black text-green-400 font-mono text-xs p-3 rounded max-h-64 overflow-y-auto">
                        {result.logs.map((log, index) => (
                          <div key={index} className="flex items-start space-x-2 mb-1">
                            <span className="text-gray-500 flex-shrink-0">
                              [{new Date(log.timestamp).toLocaleTimeString()}]
                            </span>
                            <Badge
                              variant="secondary"
                              className={cn('text-xs flex-shrink-0', {
                                'bg-red-500': log.level === 'error',
                                'bg-yellow-500': log.level === 'warn',
                                'bg-blue-500': log.level === 'info',
                              })}
                            >
                              {log.level.toUpperCase()}
                            </Badge>
                            <span className="flex-1 break-all">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2" />
                    <p>No logs available for this phase.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="errors" className="space-y-4">
                {result.errors && result.errors.length > 0 ? (
                  <div className="space-y-3">
                    {result.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium">{error.type}</div>
                          <div className="text-sm mt-1">{error.message}</div>
                          {error.details && (
                            <pre className="text-xs mt-2 bg-muted p-2 rounded overflow-auto">
                              {JSON.stringify(error.details, null, 2)}
                            </pre>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No errors occurred during this phase.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    );
  };

  const renderPhaseSpecificSummary = (result: PhaseResultData) => {
    switch (result.phaseId) {
      case 'scan':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-bold">{result.data.locationCount || 0}</div>
              <div className="text-sm text-muted-foreground">Locations</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-bold text-green-600">{result.data.validLocations || 0}</div>
              <div className="text-sm text-muted-foreground">Valid</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-bold text-orange-600">{result.data.issuesFound || 0}</div>
              <div className="text-sm text-muted-foreground">Issues</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-bold text-blue-600">{result.data.tabsFound || 0}</div>
              <div className="text-sm text-muted-foreground">Tabs</div>
            </div>
          </div>
        );

      case 'locations':
        return (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-bold text-green-600">{result.data.newLocations || 0}</div>
              <div className="text-sm text-muted-foreground">New</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-bold text-blue-600">{result.data.changedLocations || 0}</div>
              <div className="text-sm text-muted-foreground">Changed</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-bold text-gray-600">{result.data.unchangedLocations || 0}</div>
              <div className="text-sm text-muted-foreground">Unchanged</div>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-bold text-green-600">{result.data.validTabs || 0}</div>
              <div className="text-sm text-muted-foreground">Valid Tabs</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-bold text-red-600">{result.data.invalidTabs || 0}</div>
              <div className="text-sm text-muted-foreground">Invalid Tabs</div>
            </div>
          </div>
        );

      case 'count':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-bold text-blue-600">{result.data.totalRecords || 0}</div>
              <div className="text-sm text-muted-foreground">Total Records</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-bold text-green-600">{result.data.dataVolume || '0 MB'}</div>
              <div className="text-sm text-muted-foreground">Data Volume</div>
            </div>
          </div>
        );

      case 'import':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-bold text-green-600">{result.data.successfulImports || 0}</div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-bold text-red-600">{result.data.failedImports || 0}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!results || results.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No phase results available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {results.map(renderPhaseSummary)}
    </div>
  );
}