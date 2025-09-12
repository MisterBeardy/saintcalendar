"use client"

import React, { useState, useEffect } from "react"
import {
  Check,
  X,
  Eye,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  Users,
  ImageIcon,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface PendingChange {
  id: string
  entityType: 'LOCATION' | 'SAINT' | 'STICKER'
  entityId: string
  changes: Record<string, any>
  requestedBy: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  updatedAt: string
  reviewedBy?: string
  reviewedAt?: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface PendingChangesResponse {
  pendingChanges: PendingChange[]
  pagination: PaginationInfo
}

const entityTypeIcons = {
  SAINT: Users,
  LOCATION: MapPin,
  STICKER: ImageIcon,
}

const entityTypeColors = {
  SAINT: 'text-blue-600',
  LOCATION: 'text-green-600',
  STICKER: 'text-purple-600',
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
}

export function PendingChangesApproval() {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Dialog states
  const [selectedChange, setSelectedChange] = useState<PendingChange | null>(null)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  const fetchPendingChanges = async (page = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })

      if (entityTypeFilter !== 'all') params.append('entityType', entityTypeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/pending-changes?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch pending changes')
      }

      const data: PendingChangesResponse = await response.json()
      setPendingChanges(data.pendingChanges)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingChanges()
  }, [entityTypeFilter, statusFilter, searchTerm])

  const handleApprove = async (changeId: string) => {
    setProcessingAction(changeId)
    try {
      const response = await fetch(`/api/pending-changes/${changeId}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve change')
      }

      window.dispatchEvent(new CustomEvent('pending-changes-updated'))

      // Refresh the list
      await fetchPendingChanges(pagination.page)
      setIsApproveDialogOpen(false)
      setSelectedChange(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve change')
    } finally {
      setProcessingAction(null)
    }
  }

  const handleReject = async (changeId: string) => {
    setProcessingAction(changeId)
    try {
      const response = await fetch(`/api/pending-changes/${changeId}/reject`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject change')
      }

      window.dispatchEvent(new CustomEvent('pending-changes-updated'))
      window.dispatchEvent(new CustomEvent('saints-data-changed'))

      // Refresh the list
      await fetchPendingChanges(pagination.page)
      setIsRejectDialogOpen(false)
      setSelectedChange(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject change')
    } finally {
      setProcessingAction(null)
    }
  }

  const formatChanges = (change: PendingChange) => {
    const isDelete = change.changes.action === 'delete'

    if (isDelete) {
      return 'Delete entity'
    }

    const getDisplayValue = (val: any) => {
      if (typeof val === 'object' && val !== null && 'displayName' in val) {
        return val.displayName
      }
      return String(val)
    }

    // For updates, assume changes is Record<string, { old: any, new: any }>
    const changesArray = Object.entries(change.changes).map(([field, value]) => {
      if (typeof value === 'object' && value !== null && 'old' in value && 'new' in value) {
        const oldDisplay = getDisplayValue(value.old)
        const newDisplay = getDisplayValue(value.new)
        const prefix = field === 'location' ? 'Location: ' : ''
        return `${prefix}${oldDisplay} → ${newDisplay}`
      } else {
        const display = getDisplayValue(value)
        const prefix = field === 'location' ? 'Location: ' : ''
        return `${prefix}${display}`
      }
    })

    return changesArray.join(', ')
  }

  const renderChangeDetails = (change: PendingChange) => {
    const isDelete = change.changes.action === 'delete'

    if (isDelete) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Delete Request</span>
          </div>
          <p className="text-sm text-muted-foreground">
            This change requests the deletion of the {change.entityType.toLowerCase()} with ID: {change.entityId}
          </p>
        </div>
      )
    }

    const getDisplayValue = (val: any) => {
      if (typeof val === 'object' && val !== null && 'displayName' in val) {
        return val.displayName
      }
      return String(val)
    }

    // For updates, show diff
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-blue-600">
          <RefreshCw className="h-4 w-4" />
          <span className="font-medium">Update Request</span>
        </div>
        <div className="space-y-2">
          {Object.entries(change.changes).map(([field, value]) => {
            if (typeof value === 'object' && value !== null && 'old' in value && 'new' in value) {
              const oldDisplay = getDisplayValue(value.old)
              const newDisplay = getDisplayValue(value.new)
              const prefix = field === 'location' ? 'Location: ' : ''
              return (
                <div key={field} className="flex items-center gap-2 text-sm">
                  <span className="font-medium capitalize min-w-[100px]">{field}:</span>
                  <span className="text-muted-foreground">{oldDisplay}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium">{newDisplay}</span>
                </div>
              )
            } else {
              const display = getDisplayValue(value)
              const prefix = field === 'location' ? 'Location: ' : ''
              return (
                <div key={field} className="flex items-center gap-2 text-sm">
                  <span className="font-medium capitalize min-w-[100px]">{field}:</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium">{display}</span>
                </div>
              )
            }
          })}
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading && pendingChanges.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading pending changes...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-heading font-semibold">Pending Changes Approval</h3>
          <p className="text-sm text-muted-foreground">Review and approve pending changes to saints, locations, and stickers</p>
        </div>
        <Button onClick={() => fetchPendingChanges(pagination.page)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by entity ID or requester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SAINT">Saints</SelectItem>
                <SelectItem value="LOCATION">Locations</SelectItem>
                <SelectItem value="STICKER">Stickers</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity Type</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Change Type</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingChanges.map((change) => {
                const EntityIcon = entityTypeIcons[change.entityType]
                const isDelete = change.changes.action === 'delete'

                return (
                  <TableRow key={change.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EntityIcon className={cn('h-4 w-4', entityTypeColors[change.entityType])} />
                        <span className="font-medium">{change.entityType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{change.entityId}</TableCell>
                    <TableCell>
                      <Badge variant={isDelete ? "destructive" : "secondary"}>
                        {isDelete ? 'Delete' : 'Update'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {formatChanges(change)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{change.requestedBy}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(change.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[change.status]}>
                        {change.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedChange(change)
                            setIsDetailsDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {change.status === 'PENDING' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedChange(change)
                                setIsApproveDialogOpen(true)
                              }}
                              disabled={processingAction === change.id}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedChange(change)
                                setIsRejectDialogOpen(true)
                              }}
                              disabled={processingAction === change.id}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {pendingChanges.length === 0 && !loading && (
            <div className="p-8 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No pending changes found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} changes
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPendingChanges(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPendingChanges(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change Details</DialogTitle>
            <DialogDescription>
              Review the details of this pending change request
            </DialogDescription>
          </DialogHeader>
          {selectedChange && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Entity Type</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {React.createElement(entityTypeIcons[selectedChange.entityType], {
                      className: cn('h-4 w-4', entityTypeColors[selectedChange.entityType])
                    })}
                    <span className="font-medium">{selectedChange.entityType}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Entity ID</Label>
                  <p className="font-mono text-sm mt-1">{selectedChange.entityId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Requested By</Label>
                  <p className="mt-1">{selectedChange.requestedBy}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <p className="text-sm mt-1">{formatDate(selectedChange.createdAt)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Change Details</Label>
                <Card className="mt-2">
                  <CardContent className="p-4">
                    {renderChangeDetails(selectedChange)}
                  </CardContent>
                </Card>
              </div>

              {selectedChange.status !== 'PENDING' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Reviewed By</Label>
                    <p className="mt-1">{selectedChange.reviewedBy || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Reviewed At</Label>
                    <p className="text-sm mt-1">{selectedChange.reviewedAt ? formatDate(selectedChange.reviewedAt) : 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this change? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedChange && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  {renderChangeDetails(selectedChange)}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
              disabled={processingAction !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedChange && handleApprove(selectedChange.id)}
              disabled={processingAction !== null}
            >
              {processingAction === selectedChange?.id ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this change? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedChange && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  {renderChangeDetails(selectedChange)}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={processingAction !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedChange && handleReject(selectedChange.id)}
              disabled={processingAction !== null}
            >
              {processingAction === selectedChange?.id ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}