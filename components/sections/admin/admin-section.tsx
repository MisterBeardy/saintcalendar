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

interface AdminSectionProps {
  selectedLocation: string
  activeSubSection?: string
}

export function AdminSection({ selectedLocation, activeSubSection }: AdminSectionProps) {
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

  React.useEffect(() => {
    setActiveTab(getTabFromSubSection(activeSubSection))
  }, [activeSubSection])

  const [isAddSaintOpen, setIsAddSaintOpen] = useState(false)
  const [isEditSaintOpen, setIsEditSaintOpen] = useState(false)
  const [isViewSaintOpen, setIsViewSaintOpen] = useState(false)
  const [isPendingChangesOpen, setIsPendingChangesOpen] = useState(false)
  const [selectedSaint, setSelectedSaint] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

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
    location: "",
    status: "active",
    email: "",
    phone: "",
    notes: "",
  })

  // Fetch pending changes from database
  const [pendingChanges, setPendingChanges] = useState<any[]>([])
  const [loadingPendingChanges, setLoadingPendingChanges] = useState(true)

  useEffect(() => {
    const fetchPendingChanges = async () => {
      try {
        const response = await fetch('/api/pending-changes')
        if (response.ok) {
          const data = await response.json()
          setPendingChanges(data.pendingChanges || [])
        }
      } catch (error) {
        console.error('Failed to fetch pending changes:', error)
      } finally {
        setLoadingPendingChanges(false)
      }
    }

    fetchPendingChanges()
  }, [])

  const [saints, setSaints] = useState<any[]>([])
  const [loadingSaints, setLoadingSaints] = useState(true)

  useEffect(() => {
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

    fetchSaints()
  }, [])

  const filteredSaints = Array.isArray(saints) ? saints.filter((saint) => {
    const matchesSearch =
      saint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      saint.saintName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      saint.location.toLowerCase().includes(searchTerm.toLowerCase())
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
      location: "",
      status: "active",
      email: "",
      phone: "",
      notes: "",
    })
    setIsAddSaintOpen(false)
  }

  const handleEditSaint = () => {
    const currentSaints = Array.isArray(saints) ? saints : []
    const originalSaint = currentSaints.find((s) => s.id === selectedSaint.id)
    const changes: any = {}

    Object.keys(selectedSaint).forEach((key) => {
      if (originalSaint && selectedSaint[key] !== originalSaint[key] && key !== "id") {
        changes[key] = selectedSaint[key]
      }
    })

    if (Object.keys(changes).length > 0) {
      const currentPendingChanges = Array.isArray(pendingChanges) ? pendingChanges : []
      const newPendingChange = {
        id: currentPendingChanges.length + 1,
        saintId: selectedSaint.id,
        saintName: selectedSaint.name,
        changeType: "edit",
        changes,
        submittedBy: "Current User",
        submittedDate: new Date().toISOString().split("T")[0],
        status: "pending",
        comments: [],
      }
      setPendingChanges([...currentPendingChanges, newPendingChange])
    }

    setIsEditSaintOpen(false)
    setSelectedSaint(null)
  }

  const handleDeleteSaint = (saintId: number) => {
    const currentSaints = Array.isArray(saints) ? saints : []
    setSaints(currentSaints.filter((saint) => saint.id !== saintId))
  }

  const handleViewSaint = (saint: any) => {
    setSelectedSaint(saint)
    setIsViewSaintOpen(true)
  }

  const handleEditClick = (saint: any) => {
    setSelectedSaint({ ...saint })
    setIsEditSaintOpen(true)
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

  const handleApprovePendingChange = (changeId: number) => {
    const change = Array.isArray(pendingChanges) ? pendingChanges.find((c) => c.id === changeId) : null
    if (change) {
      const currentSaints = Array.isArray(saints) ? saints : []
      setSaints(currentSaints.map((saint) => (saint.id === change.saintId ? { ...saint, ...change.changes } : saint)))

      setPendingChanges(Array.isArray(pendingChanges) ? pendingChanges.map((c) => (c.id === changeId ? { ...c, status: "approved" } : c)) : [])
    }
  }

  const handleRejectPendingChange = (changeId: number) => {
    setPendingChanges(Array.isArray(pendingChanges) ? pendingChanges.map((c) => (c.id === changeId ? { ...c, status: "rejected" } : c)) : [])
  }

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
        {renderOverview && (
          <div className="space-y-3">
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
                  <CardTitle className="text-sm font-medium">Pending Stickers</CardTitle>
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
          </div>
        )}
        {renderSaintManagement && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-heading font-semibold">Saint Management</h3>
                <p className="text-sm text-muted-foreground">Manage saint profiles and information</p>
              </div>
              <Dialog open={isAddSaintOpen} onOpenChange={setIsAddSaintOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Saint
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Saint</DialogTitle>
                    <DialogDescription>Create a new saint profile with their information</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newSaint.name}
                        onChange={(e) => setNewSaint({ ...newSaint, name: e.target.value })}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="saintName">Saint Name</Label>
                      <Input
                        id="saintName"
                        value={newSaint.saintName}
                        onChange={(e) => setNewSaint({ ...newSaint, saintName: e.target.value })}
                        placeholder="Enter saint name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="saintDate">Saint Date</Label>
                      <Input
                        id="saintDate"
                        type="date"
                        value={newSaint.saintDate}
                        onChange={(e) => setNewSaint({ ...newSaint, saintDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Select
                        value={newSaint.location}
                        onValueChange={(value) => setNewSaint({ ...newSaint, location: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(locations) ? locations.map((location) => (
                            <SelectItem key={location.id} value={`${location.state} - ${location.city}`}>
                              {location.state} - {location.city}
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newSaint.email}
                        onChange={(e) => setNewSaint({ ...newSaint, email: e.target.value })}
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newSaint.phone}
                        onChange={(e) => setNewSaint({ ...newSaint, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newSaint.notes}
                        onChange={(e) => setNewSaint({ ...newSaint, notes: e.target.value })}
                        placeholder="Additional notes about the saint"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddSaintOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSaint}>Add Saint</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search saints by name, saint name, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filteredSaints.map((saint) => (
                <Card key={saint.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-primary">{saint.saintName.charAt(0)}</span>
                        </div>
                        <div>
                          <h4 className="font-medium">{saint.name}</h4>
                          <p className="text-sm text-muted-foreground">Saint Name: {saint.saintName}</p>
                          <p className="text-sm text-muted-foreground">Saint Date: {saint.saintDate}</p>
                          <p className="text-sm text-muted-foreground">Location: {saint.location}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">Total Beers: {saint.totalBeers}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">Milestones: {saint.milestones.length}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={saint.status === "active" ? "default" : "secondary"}>{saint.status}</Badge>
                        <Button variant="outline" size="sm" onClick={() => handleViewSaint(saint)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(saint)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteSaint(saint.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={isViewSaintOpen} onOpenChange={setIsViewSaintOpen}>
              <DialogContent className="max-w-9xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Saint Details</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsViewSaintOpen(false)
                        handleEditClick(selectedSaint)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTitle>
                  <DialogDescription>Complete information for {selectedSaint?.name}</DialogDescription>
                </DialogHeader>
                {selectedSaint && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                        <p className="font-medium">{selectedSaint.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Saint Name</Label>
                        <p className="font-medium">{selectedSaint.saintName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Saint Date</Label>
                        <p className="font-medium">{selectedSaint.saintDate}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                        <p className="font-medium">{selectedSaint.location}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Total Beers</Label>
                        <p className="font-medium">{selectedSaint.totalBeers}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Milestones</Label>
                      <div className="flex gap-2 mt-1">
                        {Array.isArray(selectedSaint.milestones) ? selectedSaint.milestones.map((milestone: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {milestone}
                          </Badge>
                        )) : null}
                      </div>
                    </div>
                    {selectedSaint.notes && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                        <p className="text-sm mt-1">{selectedSaint.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={isEditSaintOpen} onOpenChange={setIsEditSaintOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Saint</DialogTitle>
                  <DialogDescription>Update saint information</DialogDescription>
                </DialogHeader>
                {selectedSaint && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Full Name</Label>
                      <Input
                        id="edit-name"
                        value={selectedSaint.name}
                        onChange={(e) => setSelectedSaint({ ...selectedSaint, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-saintName">Saint Name</Label>
                      <Input
                        id="edit-saintName"
                        value={selectedSaint.saintName}
                        onChange={(e) => setSelectedSaint({ ...selectedSaint, saintName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-saintDate">Saint Date</Label>
                      <Input
                        id="edit-saintDate"
                        value={selectedSaint.saintDate}
                        onChange={(e) => setSelectedSaint({ ...selectedSaint, saintDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-location">Location</Label>
                      <Select
                        value={selectedSaint.location}
                        onValueChange={(value) => setSelectedSaint({ ...selectedSaint, location: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(locations) ? locations.map((location) => (
                            <SelectItem key={location.id} value={`${location.state} - ${location.city}`}>
                              {location.state} - {location.city}
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-totalBeers">Total Beers</Label>
                      <Input
                        id="edit-totalBeers"
                        type="number"
                        value={selectedSaint.totalBeers}
                        onChange={(e) =>
                          setSelectedSaint({ ...selectedSaint, totalBeers: Number.parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-notes">Notes</Label>
                      <Textarea
                        id="edit-notes"
                        value={selectedSaint.notes}
                        onChange={(e) => setSelectedSaint({ ...selectedSaint, notes: e.target.value })}
                      />
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsEditSaintOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditSaint}>Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {renderStickerManagement && (
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-heading font-semibold">Sticker Management</h3>
              <p className="text-sm text-muted-foreground">Review and approve sticker submissions</p>
            </div>

            <div className="space-y-4">
              {Array.isArray(pendingChanges) ? pendingChanges.map((change) => (
                <Card key={change.id}>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Changes to {change.saintName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Submitted by {change.submittedBy} on {change.submittedDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              change.status === "approved"
                                ? "default"
                                : change.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {change.status}
                          </Badge>
                          {change.status === "pending" && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleApprovePendingChange(change.id)}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleRejectPendingChange(change.id)}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-3">
                        <Label className="text-sm font-medium text-muted-foreground">Proposed Changes:</Label>
                        <div className="mt-2 space-y-1">
                          {Object.entries(change.changes).map(([field, value]) => (
                            <div key={field} className="text-sm">
                              <span className="font-medium capitalize">{field}:</span>{" "}
                              <span className="text-muted-foreground">→</span>{" "}
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {Array.isArray(change.comments) && change.comments.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Comments:</Label>
                          <div className="mt-1 space-y-2">
                            {change.comments.map((comment: any, index: number) => (
                              <div key={index} className="text-sm bg-muted/20 rounded p-2">
                                <span className="font-medium">{comment.author}:</span> {comment.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )) : null}
            </div>
          </div>
        )}

        {renderLocationManagement && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-heading font-semibold">Location Management</h3>
                <p className="text-sm text-muted-foreground">Manage active and pending locations</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Array.isArray(locations) ? locations.filter((l) => l.status === "active").length : 0}</div>
                  <p className="text-xs text-muted-foreground">Currently operational</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Locations</CardTitle>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Array.isArray(locations) ? locations.filter((l) => l.status === "pending").length : 0}</div>
                  <p className="text-xs text-muted-foreground">Awaiting setup</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {Array.isArray(locations) ? locations.map((location) => (
                <Card key={location.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">
                            {location.name}, {location.state}
                          </h4>
                          <p className="text-sm text-muted-foreground">Saints: {location.saintsCount}</p>
                          <p className="text-sm text-muted-foreground">Last Activity: {location.lastActivity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={location.status === "active" ? "default" : "secondary"}
                          className={
                            location.status === "active"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }
                        >
                          {location.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {location.status === "pending" && (
                          <Button variant="outline" size="sm">
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : null}
            </div>
          </div>
        )}

        {renderChangeLog && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-heading font-semibold">Change Log</h3>
                <p className="text-sm text-muted-foreground">Complete audit trail of all system changes</p>
              </div>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="saint">Saint Changes</SelectItem>
                    <SelectItem value="sticker">Sticker Actions</SelectItem>
                    <SelectItem value="location">Location Updates</SelectItem>
                    <SelectItem value="import">Data Imports</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="today">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Changes</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Array.isArray(changeLog) ? changeLog.filter((log) => log.timestamp.startsWith("2024-01-15")).length : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Actions performed</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Array.isArray(changeLog) ? changeLog.filter((log) => log.status === "pending_approval").length : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Array.isArray(changeLog) ? new Set(changeLog.map((log) => log.user)).size : 0}</div>
                  <p className="text-xs text-muted-foreground">Making changes</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {Array.isArray(changeLog) ? changeLog.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            log.status === "completed"
                              ? "bg-green-500"
                              : log.status === "pending_approval"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{log.action}</span>
                            <Badge variant="outline" className="text-xs">
                              {log.section}
                            </Badge>
                            <Badge
                              variant={log.status === "completed" ? "default" : "secondary"}
                              className={`text-xs ${
                                log.status === "completed"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : log.status === "pending_approval"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                              }`}
                            >
                              {log.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">{log.target}</span> - {log.changes}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>By {log.user}</span>
                            <span>•</span>
                            <span>{log.timestamp}</span>
                            <span>•</span>
                            <span>IP: {log.ipAddress}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : null}
            </div>
          </div>
        )}

        {renderDatabaseImport && (
          <Phase4ImportPanel />
        )}
      </div>
    </div>
  )
}


