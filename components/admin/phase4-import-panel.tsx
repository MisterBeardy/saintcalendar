'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Upload,
  History,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info,
  Database,
  FileText,
  Clock
} from 'lucide-react';
import { ImportProgressTracker } from './import-progress-tracker';
import { ImportResultsViewer, ImportResult } from './import-results-viewer';
import { ImportHistoryViewer } from './import-history-viewer';
import { ImportStatusBadge } from './import-status-badge';
import { cn } from '@/lib/utils';

interface Phase4ImportPanelProps {
  className?: string;
}

export function Phase4ImportPanel({ className }: Phase4ImportPanelProps) {
  const [activeTab, setActiveTab] = useState('control');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentImportId, setCurrentImportId] = useState<string | null>(null);
  const [lastImportResult, setLastImportResult] = useState<ImportResult | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'failed'>('idle');
  const [systemReady, setSystemReady] = useState(true);
  const [systemStatus, setSystemStatus] = useState<{
    database: boolean;
    googleSheets: boolean;
    permissions: boolean;
  }>({
    database: true,
    googleSheets: true,
    permissions: true,
  });

  // Check system readiness
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        // TODO: Replace with actual API calls
        // const dbResponse = await fetch('/api/database/status');
        // const sheetsResponse = await fetch('/api/google-sheets/status');
        // const permissionsResponse = await fetch('/api/auth/permissions');

        setSystemStatus({
          database: true, // dbResponse.ok
          googleSheets: true, // sheetsResponse.ok
          permissions: true, // permissionsResponse.ok
        });
      } catch (error) {
        console.error('Failed to check system status:', error);
      }
    };

    checkSystemStatus();
  }, []);

  const handleStartImport = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/imports/phase4', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phase: 4 })
      // });
      // const data = await response.json();

      // Mock response
      const mockImportId = `imp_${Date.now()}`;
      setCurrentImportId(mockImportId);
      setImportStatus('running');
      setIsImportDialogOpen(false);
      setActiveTab('progress');

      // Simulate import completion after some time
      setTimeout(() => {
        setImportStatus('completed');
        setLastImportResult({
          importId: mockImportId,
          status: 'completed',
          summary: 'Phase 4 database import completed successfully',
          timestamp: new Date().toISOString(),
          duration: 245,
          records: {
            total: 1250,
            successful: 1245,
            failed: 5,
            skipped: 0,
          },
          data: {
            saints: 450,
            events: 320,
            locations: 280,
            milestones: 150,
            historicalRecords: 50,
          },
          errors: [
            {
              type: 'Validation Error',
              message: 'Some records had invalid date formats',
              count: 5,
              details: { invalidDates: ['2023-13-45', '2024-02-30'] }
            }
          ],
          warnings: [
            {
              type: 'Data Quality',
              message: 'Some records had missing optional fields',
              count: 12,
            }
          ],
          performance: {
            recordsPerSecond: 5.1,
            peakMemoryUsage: 256 * 1024 * 1024, // 256MB
            totalMemoryUsage: 512 * 1024 * 1024, // 512MB
          },
        });
      }, 5000);

    } catch (error) {
      console.error('Failed to start import:', error);
      setImportStatus('failed');
    }
  };

  const handleCancelImport = async () => {
    if (!currentImportId) return;

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/imports/${currentImportId}/cancel`, { method: 'POST' });

      setImportStatus('idle');
      setCurrentImportId(null);
    } catch (error) {
      console.error('Failed to cancel import:', error);
    }
  };

  const handlePauseImport = async () => {
    if (!currentImportId) return;

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/imports/${currentImportId}/pause`, { method: 'POST' });

      setImportStatus('paused');
    } catch (error) {
      console.error('Failed to pause import:', error);
    }
  };

  const handleResumeImport = async () => {
    if (!currentImportId) return;

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/imports/${currentImportId}/resume`, { method: 'POST' });

      setImportStatus('running');
    } catch (error) {
      console.error('Failed to resume import:', error);
    }
  };

  const handleRetryImport = async () => {
    setImportStatus('idle');
    setCurrentImportId(null);
    setLastImportResult(null);
    setActiveTab('control');
  };

  const isSystemReady = systemStatus.database && systemStatus.googleSheets && systemStatus.permissions;

  return (
    <div className={cn('space-y-6', className)}>
      {/* System Status Alert */}
      {!isSystemReady && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">System Not Ready</div>
            <div className="text-sm space-y-1">
              {!systemStatus.database && <div>• Database connection unavailable</div>}
              {!systemStatus.googleSheets && <div>• Google Sheets API unavailable</div>}
              {!systemStatus.permissions && <div>• Insufficient permissions</div>}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Phase 4 Database Import Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isSystemReady ? "default" : "destructive"}>
                {isSystemReady ? "System Ready" : "System Issues"}
              </Badge>
              {importStatus !== 'idle' && (
                <ImportStatusBadge status={importStatus} />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="control" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Control
              </TabsTrigger>
              <TabsTrigger value="progress" disabled={!currentImportId} className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="results" disabled={!lastImportResult} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Results
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="control" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Import Control */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Import Control</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Start a new Phase 4 database import process. This will import all validated data from Google Sheets into the database.
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Data validation completed</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Schema verification passed</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Backup created</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => setIsImportDialogOpen(true)}
                      disabled={!isSystemReady || importStatus === 'running'}
                      className="w-full"
                      size="lg"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Start Phase 4 Import
                    </Button>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Database Connection</span>
                        <Badge variant={systemStatus.database ? "default" : "destructive"}>
                          {systemStatus.database ? "Connected" : "Disconnected"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Google Sheets API</span>
                        <Badge variant={systemStatus.googleSheets ? "default" : "destructive"}>
                          {systemStatus.googleSheets ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">User Permissions</span>
                        <Badge variant={systemStatus.permissions ? "default" : "destructive"}>
                          {systemStatus.permissions ? "Granted" : "Denied"}
                        </Badge>
                      </div>
                    </div>

                    {lastImportResult && (
                      <div className="pt-4 border-t">
                        <div className="text-sm font-medium mb-2">Last Import</div>
                        <div className="flex items-center gap-2">
                          <ImportStatusBadge status={lastImportResult.status} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(lastImportResult.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              {currentImportId ? (
                <ImportProgressTracker
                  importId={currentImportId}
                  onCancel={handleCancelImport}
                  onPause={handlePauseImport}
                  onResume={handleResumeImport}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>No active import in progress</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {lastImportResult ? (
                <ImportResultsViewer
                  result={lastImportResult}
                  onRetryImport={handleRetryImport}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p>No import results available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <ImportHistoryViewer />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Import Confirmation Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Phase 4 Import</DialogTitle>
            <DialogDescription>
              This will start the Phase 4 database import process. The import will process all validated data from Google Sheets and may take several minutes to complete.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">What will happen:</div>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• All data will be validated before import</li>
                  <li>• Progress will be tracked in real-time</li>
                  <li>• Import can be paused or cancelled if needed</li>
                  <li>• A full backup will be created automatically</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Important:</div>
                <div className="text-sm">
                  This operation will modify the database. Ensure you have a recent backup and that no other processes are running.
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartImport}>
              <Play className="h-4 w-4 mr-2" />
              Start Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}