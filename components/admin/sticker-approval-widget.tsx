"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Eye, Clock, AlertTriangle } from 'lucide-react'
import { useNotificationActions } from './notification-system'

interface PendingSticker {
  id: string
  saintName: string
  location: string
  submittedBy: string
  submittedAt: string
  imageUrl?: string
}

interface StickerApprovalWidgetProps {
  onNavigateToApprovals?: () => void
  compact?: boolean
}

export function StickerApprovalWidget({ onNavigateToApprovals, compact = true }: StickerApprovalWidgetProps) {
  const [pendingStickers, setPendingStickers] = useState<PendingSticker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { success, error: showError } = useNotificationActions()

  useEffect(() => {
    const fetchPendingStickers = async () => {
      try {
        const response = await fetch('/api/stickers/pending?limit=5')
        if (response.ok) {
          const data = await response.json()
          setPendingStickers(data.stickers || [])
        } else {
          setError('Failed to fetch pending stickers')
        }
      } catch (err) {
        console.error('Error fetching pending stickers:', err)
        setError('Failed to load pending stickers')
      } finally {
        setLoading(false)
      }
    }

    fetchPendingStickers()
  }, [])

  const handleQuickApprove = async (stickerId: string) => {
    try {
      const response = await fetch(`/api/stickers/${stickerId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'admin' })
      })

      if (response.ok) {
        setPendingStickers(prev => prev.filter(s => s.id !== stickerId))
        success('Sticker Approved', 'The sticker has been successfully approved and is now available.')
      } else {
        showError('Approval Failed', 'Failed to approve the sticker. Please try again.')
      }
    } catch (error) {
      console.error('Error approving sticker:', error)
      showError('Approval Error', 'An error occurred while approving the sticker.')
    }
  }

  const handleQuickReject = async (stickerId: string) => {
    try {
      const response = await fetch(`/api/stickers/${stickerId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectedBy: 'admin', reason: 'Quick rejection from dashboard' })
      })

      if (response.ok) {
        setPendingStickers(prev => prev.filter(s => s.id !== stickerId))
        success('Sticker Rejected', 'The sticker has been rejected and removed from the approval queue.')
      } else {
        showError('Rejection Failed', 'Failed to reject the sticker. Please try again.')
      }
    } catch (error) {
      console.error('Error rejecting sticker:', error)
      showError('Rejection Error', 'An error occurred while rejecting the sticker.')
    }
  }

  if (error) {
    return (
      <Card className={compact ? "col-span-1 md:col-span-2" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Sticker Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={compact ? "col-span-1 md:col-span-2" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-orange-500" />
          Pending Sticker Approvals
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          {loading ? '...' : pendingStickers.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
          </div>
        ) : pendingStickers.length === 0 ? (
          <div className="text-center py-4">
            <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingStickers.slice(0, compact ? 3 : 5).map((sticker) => (
              <div key={sticker.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {sticker.imageUrl && (
                      <img
                        src={sticker.imageUrl}
                        alt="Sticker preview"
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {sticker.saintName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {sticker.location} • {sticker.submittedBy}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() => handleQuickApprove(sticker.id)}
                    title="Approve sticker"
                  >
                    <Check className="h-3 w-3 text-green-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() => handleQuickReject(sticker.id)}
                    title="Reject sticker"
                  >
                    <X className="h-3 w-3 text-red-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() => onNavigateToApprovals?.()}
                    title="View details"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            {pendingStickers.length > (compact ? 3 : 5) && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToApprovals}
                  className="text-xs"
                >
                  View All {pendingStickers.length} Pending
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}