"use client"

import { useState } from "react"
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
import React from "react"

interface AdminSectionProps {
  selectedLocation: string
  dataSource: "mock" | "database"
  setDataSource: (source: "mock" | "database") => void
  activeSubSection?: string
}

export function AdminSection({ selectedLocation, dataSource, setDataSource, activeSubSection }: AdminSectionProps) {
  const getTabFromSubSection = (subSection?: string) => {
    if (!subSection || subSection === "admin") return "overview"
    const tabMap: Record<string, string> = {
      "admin-overview": "overview",
      "admin-saints": "saints",
      "admin-stickers": "stickers",
      "admin-locations": "locations",
      "admin-pending": "pending",
      "admin-changelog": "changelog",
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

  const [changeLog] = useState([
    {
      id: 1,
      timestamp: "2024-01-15 14:30:22",
      user: "Admin User",
      action: "Saint Updated",
      target: "Kirby Welsko",
      changes: "Updated total beers from 1800 to 2000",
      section: "Saint Management",
      status: "completed",
      ipAddress: "192.168.1.100",
    },
    {
      id: 2,
      timestamp: "2024-01-15 13:45:10",
      user: "Moderator",
      action: "Sticker Approved",
      target: "2000 Beer Milestone Sticker",
      changes: "Approved sticker submission for Kirby",
      section: "Sticker Management",
      status: "completed",
      ipAddress: "192.168.1.101",
    },
    {
      id: 3,
      timestamp: "2024-01-15 12:20:15",
      user: "Admin User",
      action: "Location Activated",
      target: "VA - Harrisonburg Middle Bar",
      changes: "Changed status from pending to active",
      section: "Location Management",
      status: "completed",
      ipAddress: "192.168.1.100",
    },
    {
      id: 4,
      timestamp: "2024-01-15 11:15:33",
      user: "Editor",
      action: "Saint Created",
      target: "New Saint - John Doe",
      changes: "Created new saint profile with 1000 beers",
      section: "Saint Management",
      status: "pending_approval",
      ipAddress: "192.168.1.102",
    },
    {
      id: 5,
      timestamp: "2024-01-15 10:30:45",
      user: "Moderator",
      action: "Sticker Rejected",
      target: "Custom Design Sticker",
      changes: "Rejected due to inappropriate content",
      section: "Sticker Management",
      status: "completed",
      ipAddress: "192.168.1.101",
    },
    {
      id: 6,
      timestamp: "2024-01-14 16:45:20",
      user: "Admin User",
      action: "Data Import",
      target: "Saints CSV File",
      changes: "Imported 25 new saint records",
      section: "Data Import",
      status: "completed",
      ipAddress: "192.168.1.100",
    },
  ])

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

  const [pendingChanges, setPendingChanges] = useState([
    {
      id: 1,
      saintId: 1,
      saintName: "Kirby Welsko",
      changeType: "edit",
      changes: {
        name: "Kirby J. Welsko",
        location: "VA - Charlottesville",
        notes: "Updated location and added middle initial",
      },
      submittedBy: "Admin User",
      submittedDate: "2024-01-15",
      status: "pending",
      comments: [],
    },
    {
      id: 2,
      saintId: 2,
      saintName: "Sarah Johnson",
      changeType: "edit",
      changes: {
        totalBeers: 1600,
        notes: "Updated beer count after recent milestone",
      },
      submittedBy: "Location Manager",
      submittedDate: "2024-01-14",
      status: "pending",
      comments: [],
    },
  ])

  const [saints, setSaints] = useState([
    {
      id: 1,
      name: "Kirby Welsko",
      saintName: "Kirby",
      saintDate: "4/9/2016",
      location: "VA - Richmond",
      status: "active",
      email: "kirby@example.com",
      phone: "(555) 123-4567",
      totalBeers: 2000,
      milestones: ["1000 Beers", "2000 Beers"],
      notes: "Original saint, very active in community events",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      saintName: "Sarah",
      saintDate: "6/15/2017",
      location: "VA - Norfolk",
      status: "active",
      email: "sarah@example.com",
      phone: "(555) 234-5678",
      totalBeers: 1500,
      milestones: ["1000 Beers"],
      notes: "Great community organizer",
    },
    {
      id: 3,
      name: "Mike Chen",
      saintName: "Mike",
      saintDate: "8/22/2018",
      location: "NC - Charlotte",
      status: "inactive",
      email: "mike@example.com",
      phone: "(555) 345-6789",
      totalBeers: 1200,
      milestones: ["1000 Beers"],
      notes: "Moved to different location",
    },
  ])

  const filteredSaints = saints.filter((saint) => {
    const matchesSearch =
      saint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      saint.saintName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      saint.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || saint.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAddSaint = () => {
    const saint = {
      id: saints.length + 1,
      ...newSaint,
      totalBeers: 1000,
      milestones: ["1000 Beers"],
    }
    setSaints([...saints, saint])
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
    const originalSaint = saints.find((s) => s.id === selectedSaint.id)
    const changes: any = {}

    Object.keys(selectedSaint).forEach((key) => {
      if (originalSaint && selectedSaint[key] !== originalSaint[key] && key !== "id") {
        changes[key] = selectedSaint[key]
      }
    })

    if (Object.keys(changes).length > 0) {
      const newPendingChange = {
        id: pendingChanges.length + 1,
        saintId: selectedSaint.id,
        saintName: selectedSaint.name,
        changeType: "edit",
        changes,
        submittedBy: "Current User",
        submittedDate: new Date().toISOString().split("T")[0],
        status: "pending",
        comments: [],
      }
      setPendingChanges([...pendingChanges, newPendingChange])
    }

    setIsEditSaintOpen(false)
    setSelectedSaint(null)
  }

  const handleDeleteSaint = (saintId: number) => {
    setSaints(saints.filter((saint) => saint.id !== saintId))
  }

  const handleViewSaint = (saint: any) => {
    setSelectedSaint(saint)
    setIsViewSaintOpen(true)
  }

  const handleEditClick = (saint: any) => {
    setSelectedSaint({ ...saint })
    setIsEditSaintOpen(true)
  }

  const locations = [
    { id: 1, name: "Richmond", state: "VA", status: "active", saintsCount: 45, lastActivity: "2024-01-15" },
    { id: 2, name: "Norfolk", state: "VA", status: "active", saintsCount: 32, lastActivity: "2024-01-14" },
    { id: 3, name: "Charlottesville", state: "VA", status: "pending", saintsCount: 0, lastActivity: "N/A" },
    { id: 4, name: "Charlotte NoDa", state: "NC", status: "active", saintsCount: 28, lastActivity: "2024-01-13" },
    { id: 5, name: "Greenville", state: "NC", status: "pending", saintsCount: 0, lastActivity: "N/A" },
    { id: 6, name: "Harrisonburg", state: "VA", status: "active", saintsCount: 18, lastActivity: "2024-01-12" },
    { id: 7, name: "Roanoke", state: "VA", status: "pending", saintsCount: 0, lastActivity: "N/A" },
    { id: 8, name: "Chattanooga", state: "TN", status: "active", saintsCount: 22, lastActivity: "2024-01-11" },
  ]

  const handleApprovePendingChange = (changeId: number) => {
    const change = pendingChanges.find((c) => c.id === changeId)
    if (change) {
      setSaints(saints.map((saint) => (saint.id === change.saintId ? { ...saint, ...change.changes } : saint)))

      setPendingChanges(pendingChanges.map((c) => (c.id === changeId ? { ...c, status: "approved" } : c)))
    }
  }

  const handleRejectPendingChange = (changeId: number) => {
    setPendingChanges(pendingChanges.map((c) => (c.id === changeId ? { ...c, status: "rejected" } : c)))
  }

  const [overviewCards, setOverviewCards] = useState([
    {
      title: "Total Saints",
      value: 247,
      change: "+12 from last month",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Active Locations",
      value: 23,
      change: "Across 8 states",
      icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Pending Stickers",
      value: 8,
      change: "Awaiting approval",
      icon: <ImageIcon className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Data Imports",
      value: 156,
      change: "This month",
      icon: <Upload className="h-4 w-4 text-muted-foreground" />,
    },
  ])

  const [pendingLocationChanges, setPendingLocationChanges] = useState([
    {
      id: 1,
      locationId: 3,
      locationName: "Charlottesville",
      changeType: "edit",
      changes: {
        status: { from: "pending", to: "active" },
        notes: { from: "", to: "Updated status and added notes" },
      },
      submittedBy: "Admin User",
      submittedDate: "2024-01-15",
      status: "pending",
      comments: [],
    },
  ])

  const renderOverview = activeTab === "overview"
  const renderSaintManagement = activeTab === "saints"
  const renderStickerManagement = activeTab === "stickers"
  const renderLocationManagement = activeTab === "locations"
  const renderChangeLog = activeTab === "changelog"

  return (
    <div className="p-3">
      <div className="mb-6">
        <div className="text-sm text-muted-foreground">
          Location: <span className="font-medium text-foreground">{selectedLocation}</span>
        </div>
      </div>

      <div className="mb-4 bg-card rounded-lg border p-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-heading font-semibold text-lg">Data Source Configuration</h4>
            <p className="text-sm text-muted-foreground">Switch between mock data and database connections</p>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`text-sm font-medium transition-colors ${dataSource === "mock" ? "text-primary" : "text-muted-foreground"}`}
            >
              Mock Data
            </span>
            <button
              onClick={() => {
                const newSource = dataSource === "mock" ? "database" : "mock"
                setDataSource(newSource)
              }}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                dataSource === "database"
                  ? "bg-primary shadow-lg"
                  : "bg-muted-foreground/20 hover:bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                  dataSource === "database" ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium transition-colors ${dataSource === "database" ? "text-primary" : "text-muted-foreground"}`}
            >
              Database
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <div
            className={`p-2 rounded-lg border ${dataSource === "mock" ? "bg-primary/5 border-primary/20" : "bg-muted/30"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${dataSource === "mock" ? "bg-primary" : "bg-muted-foreground"}`} />
              <span className="font-medium text-sm">Saints Data</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {dataSource === "mock" ? "Using sample saints data" : "Connected to database"}
            </div>
          </div>

          <div
            className={`p-2 rounded-lg border ${dataSource === "mock" ? "bg-primary/5 border-primary/20" : "bg-muted/30"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${dataSource === "mock" ? "bg-primary" : "bg-muted-foreground"}`} />
              <span className="font-medium text-sm">Events Data</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {dataSource === "mock" ? "Using sample events data" : "Connected to database"}
            </div>
          </div>

          <div
            className={`p-2 rounded-lg border ${dataSource === "mock" ? "bg-primary/5 border-primary/20" : "bg-muted/30"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${dataSource === "mock" ? "bg-primary" : "bg-muted-foreground"}`} />
              <span className="font-medium text-sm">Locations Data</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {dataSource === "mock" ? "Using sample locations data" : "Connected to database"}
            </div>
          </div>
        </div>

        {dataSource === "database" && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="font-medium text-sm">Database Integration Pending</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Database connections will be configured when API endpoints are implemented.
            </p>
          </div>
        )}
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
                  <div className="text-2xl font-bold">247</div>
                  <p className="text-xs text-muted-foreground">+12 from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">Across 8 states</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Stickers</CardTitle>
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">Awaiting approval</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Imports</CardTitle>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-muted-foreground">This month</p>
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
                          <SelectItem value="VA - Richmond">VA - Richmond</SelectItem>
                          <SelectItem value="VA - Norfolk">VA - Norfolk</SelectItem>
                          <SelectItem value="NC - Charlotte">NC - Charlotte</SelectItem>
                          <SelectItem value="TN - Chattanooga">TN - Chattanooga</SelectItem>
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
              <DialogContent className="max-w-2xl">
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
                        {selectedSaint.milestones.map((milestone: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {milestone}
                          </Badge>
                        ))}
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
                          <SelectItem value="VA - Richmond">VA - Richmond</SelectItem>
                          <SelectItem value="VA - Norfolk">VA - Norfolk</SelectItem>
                          <SelectItem value="NC - Charlotte">NC - Charlotte</SelectItem>
                          <SelectItem value="TN - Chattanooga">TN - Chattanooga</SelectItem>
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
              {pendingChanges.map((change) => (
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

                      {change.comments.length > 0 && (
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
              ))}
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
                  <div className="text-2xl font-bold">{locations.filter((l) => l.status === "active").length}</div>
                  <p className="text-xs text-muted-foreground">Currently operational</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Locations</CardTitle>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{locations.filter((l) => l.status === "pending").length}</div>
                  <p className="text-xs text-muted-foreground">Awaiting setup</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {locations.map((location) => (
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
              ))}
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
                    {changeLog.filter((log) => log.timestamp.startsWith("2024-01-15")).length}
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
                    {changeLog.filter((log) => log.status === "pending_approval").length}
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
                  <div className="text-2xl font-bold">{new Set(changeLog.map((log) => log.user)).size}</div>
                  <p className="text-xs text-muted-foreground">Making changes</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {changeLog.map((log) => (
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
