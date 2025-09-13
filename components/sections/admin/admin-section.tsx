"use client"
import React, { useState, useEffect } from "react"
import {
  Users,
  ImageIcon,
  Upload,
  Check,
  X,
  Eye,
  Edit,
  Trash2,
  Plus,
  MapPin,
  Search,
  Filter,
  Activity,
  Clock,
  Database,
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
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Phase4ImportPanel } from "@/components/admin/phase4-import-panel"
import { PendingChangesApproval } from "@/components/admin/pending-changes-approval"
import { StickerManagement } from "@/components/admin/sticker-management"
import { AdminOverviewPage } from "@/components/admin/AdminOverviewPage"
import { AdminSaintsPage } from "@/components/admin/AdminSaintsPage"
import { AdminLocationsPage } from "@/components/admin/AdminLocationsPage"
import { AdminChangelogPage } from "@/components/admin/AdminChangelogPage"
import { LocationDetailsModal } from "@/components/modals/location-details-modal"
import { Milestone } from "@/lib/generated/prisma"

interface AdminSectionProps {
  selectedLocation: string
  activeSubSection?: string
  onNavigateToSection?: (section: string) => void
}

export function AdminSection({ selectedLocation, activeSubSection, onNavigateToSection }: AdminSectionProps) {
  const getTabFromSubSection = (subSection?: string) => {
    if (!subSection || subSection === "admin") return "overview"
    const tabMap: Record<string, string> = {
      "admin-overview": "overview",
      "admin-saints": "saints",
      "admin-stickers": "stickers",
      "admin-locations": "locations",
      "admin-pending": "pending",
      "admin-changelog": "changelog",
      "admin-database-import": "database-import",
    }
    return tabMap[subSection] || "overview"
  }

  const [activeTab, setActiveTab] = useState(getTabFromSubSection(activeSubSection))

  const handleNavigateToPending = () => {
    setActiveTab('pending')
    if (onNavigateToSection) {
      onNavigateToSection('admin-pending')
    }
  }

  React.useEffect(() => {
    setActiveTab(getTabFromSubSection(activeSubSection))
  }, [activeSubSection])

  const [isAddSaintOpen, setIsAddSaintOpen] = useState(false)
  const [isEditSaintOpen, setIsEditSaintOpen] = useState(false)
  const [isViewSaintOpen, setIsViewSaintOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isPendingChangesOpen, setIsPendingChangesOpen] = useState(false)
  const [selectedSaint, setSelectedSaint] = useState<any>(null)
  const [saintToDelete, setSaintToDelete] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [errorEdit, setErrorEdit] = useState<string | null>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [errorDelete, setErrorDelete] = useState<string | null>(null)
  const [selectedLocationForModal, setSelectedLocationForModal] = useState(null)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  // Fetch change log from database
  const [changeLog, setChangeLog] = useState<any[]>([])
  const [loadingChangeLog, setLoadingChangeLog] = useState(true)

  useEffect(() => {
    const fetchChangeLog = async () => {
      try {
        const response = await fetch('/api/changelog')
        if (response.ok) {
          const data = await response.json()
          setChangeLog(data)
        }
      } catch (error) {
        console.error('Failed to fetch change log:', error)
      } finally {
        setLoadingChangeLog(false)
      }
    }

    fetchChangeLog()
  }, [])

  const [newSaint, setNewSaint] = useState({
    name: "",
    saintName: "",
    saintDate: "",
    location: null,
    status: "active",
    email: "",
    phone: "",
    notes: "",
  })

  const [saints, setSaints] = useState<any[]>([])
  const [loadingSaints, setLoadingSaints] = useState(true)

  const fetchSaints = async () => {
    try {
      const response = await fetch('/api/saints')
      if (response.ok) {
        const data = await response.json()
        setSaints(data)
      }
    } catch (error) {
      console.error('Failed to fetch saints:', error)
    } finally {
      setLoadingSaints(false)
    }
  }

  useEffect(() => {
    fetchSaints()
  }, [])

  useEffect(() => {
    const handleSaintsDataChanged = () => {
      fetchSaints()
    }

    window.addEventListener('saints-data-changed', handleSaintsDataChanged)

    return () => {
      window.removeEventListener('saints-data-changed', handleSaintsDataChanged)
    }
  }, [])

  const filteredSaints = Array.isArray(saints) ? saints.filter((saint) => {
    const matchesSearch =
      saint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      saint.saintName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (saint.location ? `${saint.location.state} - ${saint.location.city}`.toLowerCase().includes(searchTerm.toLowerCase()) : false)
    const matchesStatus = statusFilter === "all" || saint.status === statusFilter
    return matchesSearch && matchesStatus
  }) : []

  const handleAddSaint = () => {
    const currentSaints = Array.isArray(saints) ? saints : []
    const saint = {
      id: currentSaints.length + 1,
      ...newSaint,
      totalBeers: 1000,
      milestones: ["1000 Beers"],
    }
    setSaints([...currentSaints, saint])
    setNewSaint({
      name: "",
      saintName: "",
      saintDate: "",
      location: null,
      status: "active",
      email: "",
      phone: "",
      notes: "",
    })
    setIsAddSaintOpen(false)
  }

  const handleEditSaint = async () => {
    setLoadingEdit(true)
    setErrorEdit(null)

    const currentSaints = Array.isArray(saints) ? saints : []
    const originalSaint = currentSaints.find((s) => s.id === selectedSaint.id)
    const changes: any = {}

    Object.keys(selectedSaint).forEach((key) => {
      if (originalSaint && selectedSaint[key] !== originalSaint[key] && key !== "id") {
        changes[key] = selectedSaint[key]
      }
    })

    if (Object.keys(changes).length > 0) {
      const newPendingChange = {
        entityType: "SAINT",
        entityId: selectedSaint.id,
        changes,
        requestedBy: "Current User",
      }

      try {
        const response = await fetch('/api/pending-changes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newPendingChange),
        })

        if (!response.ok) {
          throw new Error('Failed to submit changes for approval')
        }

        // Refetch pending changes to update the list
        const fetchResponse = await fetch('/api/pending-changes')
        if (fetchResponse.ok) {
          const data = await fetchResponse.json()
        }

        setIsEditSaintOpen(false)
        setSelectedSaint(null)
      } catch (error) {
        console.error('Error submitting changes:', error)
        setErrorEdit(error instanceof Error ? error.message : 'An error occurred while submitting changes')
      }
    } else {
      setIsEditSaintOpen(false)
      setSelectedSaint(null)
    }

    setLoadingEdit(false)
  }

  const handleDeleteSaint = async () => {
    if (!saintToDelete) return

    setLoadingDelete(true)
    setErrorDelete(null)

    const newPendingChange = {
      entityType: "SAINT",
      entityId: saintToDelete.id,
      changes: { action: "delete" },
      requestedBy: "Current User",
    }

    try {
      const response = await fetch('/api/pending-changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPendingChange),
      })

      if (!response.ok) {
        throw new Error('Failed to submit delete request for approval')
      }

      // Refetch pending changes to update the list
      const fetchResponse = await fetch('/api/pending-changes')
      if (fetchResponse.ok) {
        const data = await fetchResponse.json()
      }

      setIsDeleteConfirmOpen(false)
      setSaintToDelete(null)
    } catch (error) {
      console.error('Error submitting delete request:', error)
      setErrorDelete(error instanceof Error ? error.message : 'An error occurred while submitting the delete request')
    } finally {
      setLoadingDelete(false)
    }
  }

  const handleDeleteClick = (saint: any) => {
    setSaintToDelete(saint)
    setIsDeleteConfirmOpen(true)
    setErrorDelete(null)
  }

  const handleViewSaint = (saint: any) => {
    setSelectedSaint(saint)
    setIsViewSaintOpen(true)
  }

  const handleEditClick = (saint: any) => {
    setSelectedSaint({ ...saint })
    setIsEditSaintOpen(true)
  }

  const handleLocationFilter = (status: string) => {
    setLocationFilter(status === locationFilter ? 'all' : status)
  }

  // Fetch locations from database
  const [locations, setLocations] = useState<any[]>([])
  const [loadingLocations, setLoadingLocations] = useState(true)

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations')
        if (response.ok) {
          const data = await response.json()
          setLocations(data)
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error)
      } finally {
        setLoadingLocations(false)
      }
    }

    fetchLocations()
  }, [])

  const filteredLocations = Array.isArray(locations) ? locations.filter((loc) => locationFilter === 'all' || loc.status?.toLowerCase() === locationFilter) : []

  // Fetch overview data from database
  const [overviewData, setOverviewData] = useState({
    totalSaints: 0,
    activeLocations: 0,
    pendingStickers: 0,
    dataImports: 0
  })
  const [loadingOverview, setLoadingOverview] = useState(true)

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
      } finally {
        setLoadingOverview(false)
      }
    }

    fetchOverviewData()
  }, [])

  // Fetch pending location changes from database
  const [pendingLocationChanges, setPendingLocationChanges] = useState<any[]>([])
  const [loadingPendingLocationChanges, setLoadingPendingLocationChanges] = useState(true)

  useEffect(() => {
    const fetchPendingLocationChanges = async () => {
      try {
        const response = await fetch('/api/pending-location-changes')
        if (response.ok) {
          const data = await response.json()
          setPendingLocationChanges(data)
        }
      } catch (error) {
        console.error('Failed to fetch pending location changes:', error)
      } finally {
        setLoadingPendingLocationChanges(false)
      }
    }

    fetchPendingLocationChanges()
  }, [])

  const renderOverview = activeTab === "overview"
  const renderSaintManagement = activeTab === "saints"
  const renderStickerManagement = activeTab === "stickers"
  const renderLocationManagement = activeTab === "locations"
  const renderPendingChanges = activeTab === "pending"
  const renderChangeLog = activeTab === "changelog"
  const renderDatabaseImport = activeTab === "database-import"

  return (
    <div className="p-3">
      <div className="mb-6">
        <div className="text-sm text-muted-foreground">
          Location: <span className="font-medium text-foreground">{selectedLocation}</span>
        </div>
      </div>

      <div className="space-y-6">
        {renderOverview && <AdminOverviewPage onNavigateToSection={onNavigateToSection} />}
        {renderSaintManagement && <AdminSaintsPage onNavigateToPending={handleNavigateToPending} />}

        {renderStickerManagement && (
          <StickerManagement onNavigateToPending={handleNavigateToPending} />
        )}

        {renderLocationManagement && <AdminLocationsPage onNavigateToPending={handleNavigateToPending} />}

        {renderPendingChanges && (
          <PendingChangesApproval />
        )}

        {renderChangeLog && <AdminChangelogPage />}

        {renderDatabaseImport && (
          <Phase4ImportPanel />
        )}
        <LocationDetailsModal open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen} location={selectedLocationForModal} />
      </div>
    </div>
  )
}


