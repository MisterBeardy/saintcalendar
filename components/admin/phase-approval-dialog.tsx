'use client';

import React from 'react';
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
import {
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Clock,
  Database,
  FileText,
  BarChart3,
  Upload,
  BarChart,
  PieChart
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
  LabelList
} from 'recharts';
import { cn } from '@/lib/utils';

export interface PhaseResult {
  phaseId: string;
  phaseName: string;
  status: 'success' | 'warning' | 'error';
  summary: string;
  details: {
    [key: string]: any;
  };
  issues?: string[];
  recommendations?: string[];
  canProceed: boolean;
}

interface PhaseApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRetry?: () => void;
  phaseResult: PhaseResult | null;
  isProcessing?: boolean;
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
    badge: 'success',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    badge: 'warning',
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badge: 'destructive',
  },
};

export function PhaseApprovalDialog({
  isOpen,
  onClose,
  onApprove,
  onReject,
  onRetry,
  phaseResult,
  isProcessing = false,
}: PhaseApprovalDialogProps) {
  if (!phaseResult) return null;

  const PhaseIcon = phaseIcons[phaseResult.phaseId as keyof typeof phaseIcons] || Info;
  const status = statusConfig[phaseResult.status];

  const renderPhaseSpecificDetails = () => {
    switch (phaseResult.phaseId) {
      case 'scan':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {phaseResult.details.locationCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">Locations Found</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {phaseResult.details.validLocations || 0}
              </div>
              <div className="text-sm text-muted-foreground">Valid Locations</div>
            </div>
            {phaseResult.details.issuesFound > 0 && (
              <div className="text-center p-3 bg-muted rounded-lg col-span-2">
                <div className="text-2xl font-bold text-orange-600">
                  {phaseResult.details.issuesFound}
                </div>
                <div className="text-sm text-muted-foreground">Issues Found</div>
              </div>
            )}
          </div>
        );

      case 'locations':
        return (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {phaseResult.details.newLocations || 0}
              </div>
              <div className="text-sm text-muted-foreground">New Locations</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {phaseResult.details.changedLocations || 0}
              </div>
              <div className="text-sm text-muted-foreground">Changed</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {phaseResult.details.unchangedLocations || 0}
              </div>
              <div className="text-sm text-muted-foreground">Unchanged</div>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {phaseResult.details.validTabs || 0}
                </div>
                <div className="text-sm text-muted-foreground">Valid Tabs</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {phaseResult.details.invalidTabs || 0}
                </div>
                <div className="text-sm text-muted-foreground">Invalid Tabs</div>
              </div>
            </div>
            {phaseResult.details.tabDetails && (
              <div className="space-y-2">
                <h5 className="font-medium text-sm">Tab Validation Details:</h5>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {Object.entries(phaseResult.details.tabDetails).map(([tab, status]: [string, any]) => (
                    <div key={tab} className="flex justify-between items-center text-sm">
                      <span>{tab}</span>
                      <Badge variant={status.valid ? 'default' : 'destructive'} className="text-xs">
                        {status.valid ? 'Valid' : status.errors?.join(', ') || 'Invalid'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'count':
        return (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {phaseResult.details.totalRecords || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(phaseResult.details.totalSaints || 0) + (phaseResult.details.totalHistoricalRecords || 0) + (phaseResult.details.totalMilestones || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Data Types</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(phaseResult.details.locationBreakdown || {}).length}
                </div>
                <div className="text-sm text-muted-foreground">Locations</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {phaseResult.details.totalErrors || 0}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>

            {/* Recharts Visualization - Location Breakdown Bar Chart */}
            {phaseResult.details.locationBreakdown && Object.keys(phaseResult.details.locationBreakdown).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Records by Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={Object.entries(phaseResult.details.locationBreakdown).map(([location, count]) => ({
                      location: location.length > 15 ? location.substring(0, 12) + '...' : location,
                      records: count as number,
                      fill: '#8884d8'
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="location" angle={-45} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [value, `Records in ${name}`]}
                        labelFormatter={(label) => `Location: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="records" fill="#8884d8" name="Records" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Data Type Breakdown Pie Chart */}
            {((phaseResult.details.totalSaints || 0) + (phaseResult.details.totalHistoricalRecords || 0) + (phaseResult.details.totalMilestones || 0)) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Data Type Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Saints', value: phaseResult.details.totalSaints || 0, fill: '#0088FE' },
                          { name: 'Historical Records', value: phaseResult.details.totalHistoricalRecords || 0, fill: '#00C49F' },
                          { name: 'Milestones', value: phaseResult.details.totalMilestones || 0, fill: '#FFBB28' }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        <LabelList dataKey="name" position="inside" fill="#fff" fontSize={12} />
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, `Count: ${name}`]} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Error Breakdown (if errors exist) */}
            {phaseResult.details.totalErrors && phaseResult.details.totalErrors > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Error Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <p className="text-red-600 font-medium">Total Errors: {phaseResult.details.totalErrors}</p>
                    {phaseResult.details.errorBreakdown && (
                      <div className="space-y-1">
                        <h6 className="font-medium text-muted-foreground">Error Types:</h6>
                        {Object.entries(phaseResult.details.errorBreakdown).map(([errorType, count]) => (
                          <div key={errorType} className="flex justify-between text-sm">
                            <span>{errorType}:</span>
                            <Badge variant="destructive" className="text-xs">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'import':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {phaseResult.details.successfulImports || 0}
              </div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {phaseResult.details.failedImports || 0}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            {phaseResult.details.rollbackAvailable && (
              <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg col-span-2">
                <div className="text-lg font-bold text-orange-600">Rollback Available</div>
                <div className="text-sm text-orange-700">Import can be rolled back if needed</div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center p-4 text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2" />
            <p>Phase details will be displayed here.</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhaseIcon className="h-5 w-5" />
            {phaseResult.phaseName} Phase Results
          </DialogTitle>
          <DialogDescription>
            Review the results of the {phaseResult.phaseName.toLowerCase()} phase before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Alert */}
          <Alert className={cn(status.bgColor, status.borderColor)}>
            <status.icon className={cn('h-4 w-4', status.color)} />
            <AlertDescription className={status.color}>
              {phaseResult.summary}
            </AlertDescription>
          </Alert>

          {/* Phase Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phase Details</CardTitle>
            </CardHeader>
            <CardContent>
              {renderPhaseSpecificDetails()}
            </CardContent>
          </Card>

          {/* Issues */}
          {phaseResult.issues && phaseResult.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-orange-600">Issues Found</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {phaseResult.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {phaseResult.recommendations && phaseResult.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-blue-600">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {phaseResult.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            {onRetry && phaseResult.status === 'error' && (
              <Button
                variant="outline"
                onClick={onRetry}
                disabled={isProcessing}
                className="flex-1 sm:flex-none"
              >
                <Clock className="h-4 w-4 mr-2" />
                Retry Phase
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onReject}
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              Cancel Workflow
            </Button>
          </div>
          <Button
            onClick={onApprove}
            disabled={isProcessing || !phaseResult.canProceed}
            className="flex-1 sm:flex-none"
          >
            {isProcessing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Proceed to Next Phase
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}