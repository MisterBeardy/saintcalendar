'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Undo2,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Trash2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export interface RollbackInfo {
  workflowId: string;
  canRollback: boolean;
  rollbackSteps: Array<{
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    data?: any;
  }>;
  affectedRecords: {
    locations: number;
    saints: number;
    saintYears: number;
    milestones: number;
    events: number;
  };
  estimatedDuration: number;
  warnings: string[];
}

interface ImportRollbackManagerProps {
  isOpen: boolean;
  onClose: () => void;
  rollbackInfo: RollbackInfo | null;
  onRollback: (workflowId: string) => Promise<void>;
  isProcessing?: boolean;
}

export function ImportRollbackManager({
  isOpen,
  onClose,
  rollbackInfo,
  onRollback,
  isProcessing = false,
}: ImportRollbackManagerProps) {
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [rollbackProgress, setRollbackProgress] = useState(0);

  const handleRollback = async () => {
    if (!rollbackInfo) return;

    try {
      setCurrentStep(rollbackInfo.rollbackSteps[0]?.id || null);
      setRollbackProgress(0);

      await onRollback(rollbackInfo.workflowId);

      toast.success('Rollback completed successfully');
      onClose();
    } catch (error) {
      toast.error('Rollback failed');
      console.error('Rollback error:', error);
    } finally {
      setCurrentStep(null);
      setRollbackProgress(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getTotalAffectedRecords = () => {
    if (!rollbackInfo) return 0;
    return Object.values(rollbackInfo.affectedRecords).reduce((sum, count) => sum + count, 0);
  };

  if (!rollbackInfo) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollback Not Available</DialogTitle>
            <DialogDescription>
              Rollback information is not available for this import.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5" />
            Import Rollback
          </DialogTitle>
          <DialogDescription>
            Review the rollback operation before proceeding. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rollback Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rollback Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-red-600">{getTotalAffectedRecords()}</div>
                  <div className="text-sm text-muted-foreground">Total Records</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-orange-600">{rollbackInfo.affectedRecords.locations}</div>
                  <div className="text-sm text-muted-foreground">Locations</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{rollbackInfo.affectedRecords.saints}</div>
                  <div className="text-sm text-muted-foreground">Saints</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-green-600">{rollbackInfo.affectedRecords.events}</div>
                  <div className="text-sm text-muted-foreground">Events</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated duration:</span>
                <span className="font-medium">{formatDuration(rollbackInfo.estimatedDuration)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Rollback Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rollback Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rollbackInfo.rollbackSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      step.status === 'completed'
                        ? 'bg-green-50 border-green-200'
                        : step.status === 'running'
                        ? 'bg-blue-50 border-blue-200'
                        : step.status === 'failed'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {step.status === 'running' && <Clock className="h-4 w-4 text-blue-600 animate-spin" />}
                        {step.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                        {step.status === 'pending' && <Clock className="h-4 w-4 text-gray-600" />}
                        <span className="font-medium text-sm">
                          Step {index + 1}: {step.name}
                        </span>
                      </div>
                      <Badge
                        variant={
                          step.status === 'completed'
                            ? 'default'
                            : step.status === 'running'
                            ? 'default'
                            : step.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {step.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>

                    {step.status === 'running' && (
                      <div className="mt-2">
                        <Progress value={rollbackProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {rollbackInfo.warnings.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Important Warnings:</div>
                <ul className="list-disc list-inside space-y-1">
                  {rollbackInfo.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Rollback Impact */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Rollback Impact:</div>
              <div className="text-sm space-y-1">
                <p>• All imported data from this workflow will be removed</p>
                <p>• Related events and milestones will be deleted</p>
                <p>• Location data will be reverted to its previous state</p>
                <p>• This action is irreversible</p>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRollback}
            disabled={isProcessing || !rollbackInfo.canRollback}
            className="flex-1 sm:flex-none"
          >
            {isProcessing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Rolling Back...
              </>
            ) : (
              <>
                <Undo2 className="h-4 w-4 mr-2" />
                Confirm Rollback
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}