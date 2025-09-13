"use client"
import React, { useState, useEffect } from "react"
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
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
import { Milestone } from "@/lib/generated/prisma"
import { usePendingChangesByEntity } from "@/hooks/use-pending-changes-by-entity"
import { PendingChangeBadge } from "@/components/ui/pending-change-badge"

interface AdminSaintsPageProps {
  onNavigateToPending?: () => void;
}

export function AdminSaintsPage({ onNavigateToPending }: AdminSaintsPageProps) {
  console.log('[AdminSaintsPage] Component mounted')

  const [isAddSaintOpen, setIsAddSaintOpen] = useState(false)
  const [isEditSaintOpen, setIsEditSaintOpen] = useState(false)
  const [isViewSaintOpen, setIsViewSaintOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedSaint, setSelectedSaint] = useState<any>(null)
  const [saintToDelete, setSaintToDelete] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [errorEdit, setErrorEdit] = useState<string | null>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [errorDelete, setErrorDelete] = useState<string | null>(null)
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

  // Fetch pending changes for saints
  const { hasPendingChange } = usePendingChangesByEntity('SAINT')

  const fetchSaints = async () => {
    console.log('[AdminSaintsPage] fetchSaints called')
    try {
      const response = await fetch('/api/saints')
      if (response.ok) {
        const data = await response.json()
        console.log('[AdminSaintsPage] Saints fetched successfully:', data.length, 'saints')
        setSaints(data)
      } else {
        console.error('[AdminSaintsPage] Failed to fetch saints - response not ok:', response.status)
      }
    } catch (error) {
      console.error('[AdminSaintsPage] Failed to fetch saints - error:', error)
    } finally {
      setLoadingSaints(false)
      console.log('[AdminSaintsPage] Finished fetching saints, loadingSaints set to false')
    }
  }

  useEffect(() => {
    console.log('[AdminSaintsPage] useEffect triggered - fetching saints')
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

  const filteredSaints = Array.isArray(saints) ? saints.filter((saint) => {
    const matchesSearch =
      saint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      saint.saintName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (saint.location ? `${saint.location.state} - ${saint.location.city}`.toLowerCase().includes(searchTerm.toLowerCase()) : false)
    const matchesStatus = statusFilter === "all" || saint.status === statusFilter
    return matchesSearch && matchesStatus
  }) : []

  const handleAddSaint = () => {
    console.log('[AdminSaintsPage] handleAddSaint called with newSaint:', newSaint)
    const currentSaints = Array.isArray(saints) ? saints : []
    const saint = {
      id: currentSaints.length + 1,
      ...newSaint,
      totalBeers: 1000,
      milestones: ["1000 Beers"],
    }
    console.log('[AdminSaintsPage] Adding new saint:', saint)
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
    console.log('[AdminSaintsPage] New saint added successfully, modal closed')
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

        // Dispatch event to trigger refresh of pending badges
        window.dispatchEvent(new CustomEvent('pending-changes-updated'))

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
    console.log('[AdminSaintsPage] handleDeleteClick called for saint:', saint.id, saint.name)
    setSaintToDelete(saint)
    setIsDeleteConfirmOpen(true)
    setErrorDelete(null)
    console.log('[AdminSaintsPage] Delete confirmation modal opened for saint:', saint.id)
  }

  const handleViewSaint = (saint: any) => {
    console.log('[AdminSaintsPage] handleViewSaint called for saint:', saint.id, saint.name)
    setSelectedSaint(saint)
    setIsViewSaintOpen(true)
    console.log('[AdminSaintsPage] View modal state updated for saint:', saint.id)
  }

  const handleEditClick = (saint: any) => {
    console.log('[AdminSaintsPage] handleEditClick called for saint:', saint.id, saint.name)
    setSelectedSaint({ ...saint })
    setIsEditSaintOpen(true)
    console.log('[AdminSaintsPage] Edit modal state updated for saint:', saint.id)
  }

  return (
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
                  value={newSaint.location ? (newSaint.location.displayName || `${newSaint.location.state} - ${newSaint.location.city}`) : ""}
                  onValueChange={(value) => {
                    const loc = locations.find(l => `${l.state} - ${l.city}` === value);
                    setNewSaint({ ...newSaint, location: loc });
                  }}
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
                    <p className="text-sm text-muted-foreground">Location: {saint.location ? (saint.location.displayName || `${saint.location.state} - ${saint.location.city}`) : ''}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Total Beers: {saint.totalBeers}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">Milestones: {saint.milestones.length}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <Badge variant={saint.status === "active" ? "default" : "secondary"}>{saint.status}</Badge>
                   {hasPendingChange(saint.id) && (
                     <PendingChangeBadge onClick={onNavigateToPending} />
                   )}
                   <Button variant="outline" size="sm" onClick={() => handleViewSaint(saint)}>
                     <Eye className="h-4 w-4" />
                   </Button>
                   <Button variant="outline" size="sm" onClick={() => handleEditClick(saint)}>
                     <Edit className="h-4 w-4" />
                   </Button>
                   <Button variant="outline" size="sm" onClick={() => handleDeleteClick(saint)}>
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
                  <p className="font-medium">{selectedSaint.location ? (selectedSaint.location.displayName || `${selectedSaint.location.state} - ${selectedSaint.location.city}`) : ''}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total Beers</Label>
                  <p className="font-medium">{selectedSaint.totalBeers}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Milestones</Label>
                <div className="flex gap-2 mt-1">
                  {Array.isArray(selectedSaint.milestones) ? selectedSaint.milestones.map((milestone: Milestone, index: number) => (
                    <Badge key={index} variant="outline">
                      {milestone.count}
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
                  value={selectedSaint.location?.displayName || ""}
                  onValueChange={(value) => {
                    const loc = locations.find(l => l.displayName === value);
                    setSelectedSaint({ ...selectedSaint, location: loc });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(locations) ? locations.map((location) => (
                      <SelectItem key={location.id} value={location.displayName}>
                        {location.displayName}
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
          {errorEdit && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mt-4">
              {errorEdit}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditSaintOpen(false)} disabled={loadingEdit}>
              Cancel
            </Button>
            <Button onClick={handleEditSaint} disabled={loadingEdit}>
              {loadingEdit ? "Submitting..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {saintToDelete?.name}? This action will be submitted for approval.
            </DialogDescription>
          </DialogHeader>
          {saintToDelete && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <Label className="text-sm font-medium text-muted-foreground">Saint Details:</Label>
                <div className="mt-2 space-y-1">
                  <div className="text-sm">
                    <span className="font-medium">Name:</span> {saintToDelete.name}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Saint Name:</span> {saintToDelete.saintName}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Location:</span> {saintToDelete.location ? (saintToDelete.location.displayName || `${saintToDelete.location.state} - ${saintToDelete.location.city}`) : ''}
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                This delete request will be submitted for approval and will not immediately remove the saint from the system.
              </div>
            </div>
          )}
          {errorDelete && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {errorDelete}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={loadingDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSaint} disabled={loadingDelete}>
              {loadingDelete ? "Submitting..." : "Submit Delete Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}