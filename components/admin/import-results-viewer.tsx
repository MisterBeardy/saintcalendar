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
  Users,
  MapPin,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp
} from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { ImportStatusBadge, ImportStatus } from './import-status-badge';
import { cn } from '@/lib/utils';

export interface ImportResult {
  importId: string;
  status: ImportStatus;
  summary: string;
  timestamp: string;
  duration: number;
  records: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  data: {
    saints: number;
    events: number;
    locations: number;
    milestones: number;
    historicalRecords: number;
  };
  errors: Array<{
    type: string;
    message: string;
    count: number;
    details?: any;
  }>;
  warnings: Array<{
    type: string;
    message: string;
    count: number;
  }>;
  performance: {
    recordsPerSecond: number;
    peakMemoryUsage?: number;
    totalMemoryUsage?: number;
  };
  logs?: Array<{
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
    details?: any;
  }>;
}

interface ImportResultsViewerProps {
  result: ImportResult | null;
  className?: string;
  onViewLogs?: () => void;
  onExportResults?: () => void;
  onRetryImport?: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function ImportResultsViewer({
  result,
  className,
  onViewLogs,
  onExportResults,
  onRetryImport,
}: ImportResultsViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

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

  const getSuccessRate = () => {
    if (!result || result.records.total === 0) return 0;
    return Math.round((result.records.successful / result.records.total) * 100);
  };

  const getDataTypeChartData = () => {
    if (!result) return [];
    return [
      { name: 'Saints', value: result.data.saints, fill: '#0088FE' },
      { name: 'Events', value: result.data.events, fill: '#00C49F' },
      { name: 'Locations', value: result.data.locations, fill: '#FFBB28' },
      { name: 'Milestones', value: result.data.milestones, fill: '#FF8042' },
      { name: 'Historical', value: result.data.historicalRecords, fill: '#8884D8' },
    ].filter(item => item.value > 0);
  };

  const getRecordsChartData = () => {
    if (!result) return [];
    return [
      { name: 'Successful', value: result.records.successful, fill: '#10B981' },
      { name: 'Failed', value: result.records.failed, fill: '#EF4444' },
      { name: 'Skipped', value: result.records.skipped, fill: '#F59E0B' },
    ].filter(item => item.value > 0);
  };

  if (!result) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2" />
            <p>No import results available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const successRate = getSuccessRate();

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Import Results</CardTitle>
            <ImportStatusBadge status={result.status} />
          </div>
          <div className="flex items-center gap-2">
            {onViewLogs && result.logs && result.logs.length > 0 && (
              <Button variant="outline" size="sm" onClick={onViewLogs}>
                <FileText className="h-4 w-4 mr-2" />
                View Logs
              </Button>
            )}
            {onExportResults && (
              <Button variant="outline" size="sm" onClick={onExportResults}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            {result.status === 'failed' && onRetryImport && (
              <Button variant="outline" size="sm" onClick={onRetryImport}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          Completed on {new Date(result.timestamp).toLocaleString()} • Duration: {formatDuration(result.duration)}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="errors" disabled={!result.errors.length}>
              Errors ({result.errors.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Alert */}
            <Alert className={cn(
              result.status === 'completed' ? 'border-green-200 bg-green-50' :
              result.status === 'failed' ? 'border-red-200 bg-red-50' :
              'border-yellow-200 bg-yellow-50'
            )}>
              {result.status === 'completed' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : result.status === 'failed' ? (
                <XCircle className="h-4 w-4 text-red-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              <AlertDescription className={cn(
                result.status === 'completed' ? 'text-green-800' :
                result.status === 'failed' ? 'text-red-800' :
                'text-yellow-800'
              )}>
                {result.summary}
              </AlertDescription>
            </Alert>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {result.records.total.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </div>

              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {successRate}%
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>

              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {result.performance.recordsPerSecond}
                </div>
                <div className="text-sm text-muted-foreground">Records/sec</div>
              </div>

              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {formatDuration(result.duration)}
                </div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
            </div>

            {/* Records Breakdown Chart */}
            {result.records.total > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Records Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={getRecordsChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, 'Records']} />
                      <Legend />
                      <Bar dataKey="value" name="Records" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Data Types Distribution */}
            {getDataTypeChartData().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Data Types Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={getDataTypeChartData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {getDataTypeChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Records']} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Records Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Records Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Processed:</span>
                    <Badge variant="outline">{result.records.total.toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Successful:</span>
                    <Badge className="bg-green-100 text-green-800">{result.records.successful.toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Failed:</span>
                    <Badge className="bg-red-100 text-red-800">{result.records.failed.toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Skipped:</span>
                    <Badge className="bg-yellow-100 text-yellow-800">{result.records.skipped.toLocaleString()}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Data Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data Types Imported</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Saints:
                    </span>
                    <Badge variant="outline">{result.data.saints.toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Events:
                    </span>
                    <Badge variant="outline">{result.data.events.toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Locations:
                    </span>
                    <Badge variant="outline">{result.data.locations.toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Milestones:
                    </span>
                    <Badge variant="outline">{result.data.milestones.toLocaleString()}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.performance.recordsPerSecond}
                    </div>
                    <div className="text-sm text-muted-foreground">Records/Second</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatDuration(result.duration)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Duration</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {successRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {result.performance.peakMemoryUsage && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {(result.performance.peakMemoryUsage / 1024 / 1024).toFixed(1)} MB
                    </div>
                    <div className="text-sm text-muted-foreground">Peak Memory Usage</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            {result.errors.length > 0 ? (
              <div className="space-y-3">
                {result.errors.map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">{error.type} ({error.count} occurrences)</div>
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
                <p>No errors occurred during this import.</p>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-yellow-600">Warnings:</h4>
                {result.warnings.map((warning, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">{warning.type} ({warning.count} occurrences)</div>
                      <div className="text-sm mt-1">{warning.message}</div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}