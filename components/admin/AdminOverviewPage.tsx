"use client"

import React, { useState, useEffect } from "react"
import { Users, MapPin, ImageIcon, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StickerApprovalWidget } from "./sticker-approval-widget"

interface OverviewData {
  totalSaints: number
  activeLocations: number
  pendingStickers: number
  dataImports: number
}

interface AdminOverviewPageProps {
  onNavigateToSection?: (section: string) => void
}

export function AdminOverviewPage({ onNavigateToSection }: AdminOverviewPageProps) {
  const [overviewData, setOverviewData] = useState<OverviewData>({
    totalSaints: 0,
    activeLocations: 0,
    pendingStickers: 0,
    dataImports: 0
  })
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [errorOverview, setErrorOverview] = useState<string | null>(null)

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const [saintsRes, locationsRes, stickersRes, importsRes] = await Promise.all([
          fetch('/api/saints/count'),
          fetch('/api/locations/count'),
          fetch('/api/stickers/pending/count'),
          fetch('/api/imports/count')
        ])

        const saintsData = saintsRes.ok ? await saintsRes.json() : { count: 0 }
        const locationsData = locationsRes.ok ? await locationsRes.json() : { count: 0 }
        const stickersData = stickersRes.ok ? await stickersRes.json() : { count: 0 }
        const importsData = importsRes.ok ? await importsRes.json() : { count: 0 }

        setOverviewData({
          totalSaints: saintsData.count,
          activeLocations: locationsData.count,
          pendingStickers: stickersData.count,
          dataImports: importsData.count
        })
      } catch (error) {
        console.error('Failed to fetch overview data:', error)
        setErrorOverview(error instanceof Error ? error.message : 'Failed to fetch overview data')
      } finally {
        setLoadingOverview(false)
      }
    }

    fetchOverviewData()
  }, [])

  if (errorOverview) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Error loading overview data: {errorOverview}</p>
      </div>
    )
  }

  const handleNavigateToApprovals = () => {
    // Navigate to the full sticker management page
    if (onNavigateToSection) {
      onNavigateToSection('admin-stickers')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saints</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingOverview ? '...' : overviewData.totalSaints}</div>
            <p className="text-xs text-muted-foreground">From database</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingOverview ? '...' : overviewData.activeLocations}</div>
            <p className="text-xs text-muted-foreground">From database</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Sticker Box</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingOverview ? '...' : overviewData.pendingStickers}</div>
            <p className="text-xs text-muted-foreground">From database</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Imports</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingOverview ? '...' : overviewData.dataImports}</div>
            <p className="text-xs text-muted-foreground">From database</p>
          </CardContent>
        </Card>
      </div>

      {/* Sticker Approval Widget */}
      <StickerApprovalWidget
        onNavigateToApprovals={handleNavigateToApprovals}
        compact={true}
      />
    </div>
  )
}