'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  History,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  Database
} from 'lucide-react';
import { ImportStatusBadge, ImportStatus } from './import-status-badge';
import { cn } from '@/lib/utils';

export interface ImportHistoryItem {
  importId: string;
  status: ImportStatus;
  summary: string;
  timestamp: string;
  duration: number;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  user: string;
  source: string;
}

interface ImportHistoryViewerProps {
  className?: string;
  onViewDetails?: (importId: string) => void;
  onExportHistory?: () => void;
  onRefresh?: () => void;
}

export function ImportHistoryViewer({
  className,
  onViewDetails,
  onExportHistory,
  onRefresh,
}: ImportHistoryViewerProps) {
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ImportStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'duration' | 'records'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Mock data for demonstration - replace with actual API call
  useEffect(() => {
    const mockHistory: ImportHistoryItem[] = [
      {
        importId: 'imp_001',
        status: 'completed',
        summary: 'Successfully imported 1,250 records from Google Sheets',
        timestamp: '2024-09-11T10:30:00Z',
        duration: 245,
        recordsProcessed: 1250,
        recordsSuccessful: 1245,
        recordsFailed: 5,
        user: 'admin',
        source: 'Google Sheets - Master Data'
      },
      {
        importId: 'imp_002',
        status: 'failed',
        summary: 'Import failed due to validation errors',
        timestamp: '2024-09-10T14:15:00Z',
        duration: 67,
        recordsProcessed: 450,
        recordsSuccessful: 420,
        recordsFailed: 30,
        user: 'admin',
        source: 'Google Sheets - Historical Data'
      },
      {
        importId: 'imp_003',
        status: 'completed',
        summary: 'Successfully imported 890 records from CSV upload',
        timestamp: '2024-09-09T09:45:00Z',
        duration: 156,
        recordsProcessed: 890,
        recordsSuccessful: 885,
        recordsFailed: 5,
        user: 'data_team',
        source: 'CSV Upload - saints_data.csv'
      },
      {
        importId: 'imp_004',
        status: 'running',
        summary: 'Import in progress - processing locations',
        timestamp: '2024-09-11T15:00:00Z',
        duration: 45,
        recordsProcessed: 234,
        recordsSuccessful: 230,
        recordsFailed: 4,
        user: 'admin',
        source: 'Google Sheets - Location Updates'
      },
      {
        importId: 'imp_005',
        status: 'cancelled',
        summary: 'Import cancelled by user',
        timestamp: '2024-09-08T16:20:00Z',
        duration: 23,
        recordsProcessed: 67,
        recordsSuccessful: 65,
        recordsFailed: 2,
        user: 'admin',
        source: 'Google Sheets - Test Data'
      }
    ];

    // Simulate API delay
    setTimeout(() => {
      setHistory(mockHistory);
      setLoading(false);
    }, 1000);
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/imports/history');
      // const data = await response.json();
      // setHistory(data);
    } catch (error) {
      console.error('Failed to fetch import history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history
    .filter(item => {
      const matchesSearch = item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.user.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'records':
          aValue = a.recordsProcessed;
          bValue = b.recordsProcessed;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getSuccessRate = (item: ImportHistoryItem) => {
    if (item.recordsProcessed === 0) return 0;
    return Math.round((item.recordsSuccessful / item.recordsProcessed) * 100);
  };

  const handleSort = (column: 'timestamp' | 'duration' | 'records') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ?
      <ChevronUp className="h-4 w-4" /> :
      <ChevronDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading import history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Import History
          </CardTitle>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
            {onExportHistory && (
              <Button variant="outline" size="sm" onClick={onExportHistory}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search imports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ImportStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {paginatedHistory.length} of {filteredHistory.length} imports
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* History Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date & Time
                    <SortIcon column="timestamp" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('duration')}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duration
                    <SortIcon column="duration" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('records')}
                >
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Records
                    <SortIcon column="records" />
                  </div>
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedHistory.map((item) => (
                <TableRow key={item.importId}>
                  <TableCell className="font-mono text-sm">
                    {new Date(item.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <ImportStatusBadge status={item.status} size="sm" />
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="font-medium text-sm truncate" title={item.summary}>
                        {item.summary}
                      </div>
                      <div className="text-xs text-muted-foreground truncate" title={item.source}>
                        {item.source}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatDuration(item.duration)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{item.recordsProcessed.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {getSuccessRate(item)}% success
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{item.user}</TableCell>
                  <TableCell>
                    {onViewDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(item.importId)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {filteredHistory.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2" />
            <p>No import history found matching your criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}