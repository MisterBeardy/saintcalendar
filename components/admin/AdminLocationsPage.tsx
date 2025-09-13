"use client"
import React, { useState, useEffect } from "react"
import {
  MapPin,
  Plus,
  Eye,
  Edit,
  Check,
  Trash2,
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
} from "@/components/ui/dialog"
import { LocationDetailsModal } from "@/components/modals/location-details-modal"
import { usePendingChangesByEntity } from "@/hooks/use-pending-changes-by-entity"
import { PendingChangeBadge } from "@/components/ui/pending-change-badge"

interface AdminLocationsPageProps {
  onNavigateToPending?: () => void;
}

export function AdminLocationsPage({ onNavigateToPending }: AdminLocationsPageProps) {
  console.log('[AdminLocationsPage] Component mounted')

  // Fetch locations from database
  const [locations, setLocations] = useState<any[]>([])
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [locationFilter, setLocationFilter] = useState('all')
  const [selectedLocationForModal, setSelectedLocationForModal] = useState(null)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [isEditLocationOpen, setIsEditLocationOpen] = useState(false)
  const [selectedLocationForEdit, setSelectedLocationForEdit] = useState<any>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [errorEdit, setErrorEdit] = useState<string | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [locationToDelete, setLocationToDelete] = useState<any>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [errorDelete, setErrorDelete] = useState<string | null>(null)

  // Fetch pending changes for locations
  const { hasPendingChange } = usePendingChangesByEntity('LOCATION')

  useEffect(() => {
    console.log('[AdminLocationsPage] useEffect triggered - fetching locations')
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations')
        if (response.ok) {
          const data = await response.json()
          console.log('[AdminLocationsPage] Locations fetched successfully:', data.length, 'locations')
          setLocations(data)
        } else {
          console.error('[AdminLocationsPage] Failed to fetch locations - response not ok:', response.status)
        }
      } catch (error) {
        console.error('[AdminLocationsPage] Failed to fetch locations - error:', error)
      } finally {
        setLoadingLocations(false)
        console.log('[AdminLocationsPage] Finished fetching locations, loadingLocations set to false')
      }
    }

    fetchLocations()
  }, [])

  const filteredLocations = Array.isArray(locations) ? locations.filter((loc) => locationFilter === 'all' || loc.status?.toLowerCase() === locationFilter) : []

  const handleLocationFilter = (status: string) => {
    setLocationFilter(status === locationFilter ? 'all' : status)
  }

  const handleEditLocation = async () => {
    setLoadingEdit(true)
    setErrorEdit(null)

    // Basic validation
    if (!selectedLocationForEdit.city?.trim()) {
      setErrorEdit('City is required')
      setLoadingEdit(false)
      return
    }
    if (!selectedLocationForEdit.state?.trim()) {
      setErrorEdit('State is required')
      setLoadingEdit(false)
      return
    }
    if (!selectedLocationForEdit.status) {
      setErrorEdit('Status is required')
      setLoadingEdit(false)
      return
    }
    if (selectedLocationForEdit.managerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedLocationForEdit.managerEmail)) {
      setErrorEdit('Please enter a valid email address')
      setLoadingEdit(false)
      return
    }

    const currentLocations = Array.isArray(locations) ? locations : []
    const originalLocation = currentLocations.find((loc) => loc.id === selectedLocationForEdit.id)
    const changes: any = {}

    Object.keys(selectedLocationForEdit).forEach((key) => {
      if (originalLocation && selectedLocationForEdit[key] !== originalLocation[key] && key !== "id") {
        changes[key] = selectedLocationForEdit[key]
      }
    })

    if (Object.keys(changes).length > 0) {
      const newPendingChange = {
        entityType: "LOCATION",
        entityId: selectedLocationForEdit.id.toString(),
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

        setIsEditLocationOpen(false)
        setSelectedLocationForEdit(null)
      } catch (error) {
        console.error('Error submitting changes:', error)
        setErrorEdit(error instanceof Error ? error.message : 'An error occurred while submitting changes')
      }
    } else {
      setIsEditLocationOpen(false)
      setSelectedLocationForEdit(null)
    }

    setLoadingEdit(false)
  }

  const handleDeleteLocation = async () => {
    if (!locationToDelete) return

    setLoadingDelete(true)
    setErrorDelete(null)

    const newPendingChange = {
      entityType: "LOCATION",
      entityId: locationToDelete.id.toString(),
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

      // Dispatch event to trigger refresh of pending badges
      window.dispatchEvent(new CustomEvent('pending-changes-updated'))

      setIsDeleteConfirmOpen(false)
      setLocationToDelete(null)
    } catch (error) {
      console.error('Error submitting delete request:', error)
      setErrorDelete(error instanceof Error ? error.message : 'An error occurred while submitting the delete request')
    } finally {
      setLoadingDelete(false)
    }
  }

  const handleDeleteClick = (location: any) => {
    console.log('[AdminLocationsPage] handleDeleteClick called for location:', location.id, location.city)
    setLocationToDelete(location)
    setIsDeleteConfirmOpen(true)
    setErrorDelete(null)
    console.log('[AdminLocationsPage] Delete confirmation modal opened for location:', location.id)
  }

  return (
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

      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={() => setLocationFilter('all')} className={locationFilter === 'all' ? 'bg-blue-50' : ''}>
          Show All Locations
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card onClick={() => handleLocationFilter('open')} className={`cursor-pointer transition-all ${locationFilter === 'open' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(locations) ? locations.filter((l) => l.status?.toLowerCase() === "open").length : 0}</div>
            <p className="text-xs text-muted-foreground">Currently operational</p>
          </CardContent>
        </Card>
        <Card onClick={() => handleLocationFilter('pending')} className={`cursor-pointer transition-all ${locationFilter === 'pending' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Locations</CardTitle>
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(locations) ? locations.filter((l) => l.status?.toLowerCase() === "pending").length : 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting setup</p>
          </CardContent>
        </Card>
        <Card onClick={() => handleLocationFilter('closed')} className={`cursor-pointer transition-all ${locationFilter === 'closed' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Locations</CardTitle>
            <div className="w-3 h-3 bg-red-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(locations) ? locations.filter((l) => l.status?.toLowerCase() === "closed").length : 0}</div>
            <p className="text-xs text-muted-foreground">No longer operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {Array.isArray(filteredLocations) ? filteredLocations.map((location) => (
          <Card key={location.id}>
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">
                      {location.city}, {location.state}
                    </h4>
                    <p className="text-sm text-muted-foreground">Saints: {location.saints ? location.saints.length : 0}</p>
                    <p className="text-sm text-muted-foreground">Last Activity: {(() => {
                      if (!location.saints || location.saints.length === 0) return 'No activity';
                      const allMilestones = location.saints.flatMap((saint: any) =>
                        saint.milestones ? saint.milestones.map((milestone: any) => ({
                          ...milestone,
                          saintName: saint.saintName,
                          saintNumber: saint.saintNumber
                        })) : []
                      );
                      if (allMilestones.length === 0) return 'No milestones';
                      const latestMilestone = allMilestones.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                      return `${latestMilestone.count} beers - ${latestMilestone.saintName} (${latestMilestone.saintNumber})`;
                    })()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={location.status?.toLowerCase() === "open" ? "default" : location.status?.toLowerCase() === "closed" ? "destructive" : "secondary"}
                    className={
                      location.status?.toLowerCase() === "open"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : location.status?.toLowerCase() === "closed"
                        ? "bg-red-100 text-red-800 border-red-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                    }
                  >
                    {location.status}
                  </Badge>
                  {hasPendingChange(location.id) && (
                    <PendingChangeBadge onClick={onNavigateToPending} />
                  )}
                  <Button variant="outline" size="sm" onClick={() => {
                    console.log('[AdminLocationsPage] View button clicked for location:', location.id, location.city)
                    setSelectedLocationForModal(location)
                    setIsLocationModalOpen(true)
                    console.log('[AdminLocationsPage] Modal state updated: selectedLocationForModal set, isLocationModalOpen=true')
                  }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    console.log('[AdminLocationsPage] Edit button clicked for location:', location.id, location.city)
                    setSelectedLocationForEdit({ ...location })
                    setIsEditLocationOpen(true)
                    setErrorEdit(null)
                    console.log('[AdminLocationsPage] Edit modal state updated for location:', location.id)
                  }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteClick(location)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {location.status?.toLowerCase() === "pending" && (
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

      <Dialog open={isEditLocationOpen} onOpenChange={setIsEditLocationOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>Update location information</DialogDescription>
          </DialogHeader>
          {selectedLocationForEdit && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={selectedLocationForEdit.city || ''}
                  onChange={(e) => setSelectedLocationForEdit({ ...selectedLocationForEdit, city: e.target.value })}
                  placeholder="Enter city name"
                />
              </div>
              <div>
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  value={selectedLocationForEdit.state || ''}
                  onChange={(e) => setSelectedLocationForEdit({ ...selectedLocationForEdit, state: e.target.value })}
                  placeholder="Enter state"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-displayName">Display Name</Label>
                <Input
                  id="edit-displayName"
                  value={selectedLocationForEdit.displayName || ''}
                  onChange={(e) => setSelectedLocationForEdit({ ...selectedLocationForEdit, displayName: e.target.value })}
                  placeholder="Enter display name"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={selectedLocationForEdit.address || ''}
                  onChange={(e) => setSelectedLocationForEdit({ ...selectedLocationForEdit, address: e.target.value })}
                  placeholder="Enter full address"
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={selectedLocationForEdit.status || ''}
                  onValueChange={(value) => setSelectedLocationForEdit({ ...selectedLocationForEdit, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-managerEmail">Manager Email</Label>
                <Input
                  id="edit-managerEmail"
                  type="email"
                  value={selectedLocationForEdit.managerEmail || ''}
                  onChange={(e) => setSelectedLocationForEdit({ ...selectedLocationForEdit, managerEmail: e.target.value })}
                  placeholder="Enter manager email"
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
            <Button variant="outline" onClick={() => setIsEditLocationOpen(false)} disabled={loadingEdit}>
              Cancel
            </Button>
            <Button onClick={handleEditLocation} disabled={loadingEdit}>
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
              Are you sure you want to delete {locationToDelete?.city}, {locationToDelete?.state}? This action will be submitted for approval.
            </DialogDescription>
          </DialogHeader>
          {locationToDelete && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <Label className="text-sm font-medium text-muted-foreground">Location Details:</Label>
                <div className="mt-2 space-y-1">
                  <div className="text-sm">
                    <span className="font-medium">City:</span> {locationToDelete.city}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">State:</span> {locationToDelete.state}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Status:</span> {locationToDelete.status}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Saints:</span> {locationToDelete.saints ? locationToDelete.saints.length : 0}
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                This delete request will be submitted for approval and will not immediately remove the location from the system.
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
            <Button variant="destructive" onClick={handleDeleteLocation} disabled={loadingDelete}>
              {loadingDelete ? "Submitting..." : "Submit Delete Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <LocationDetailsModal open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen} location={selectedLocationForModal} />
    </div>
  )
}