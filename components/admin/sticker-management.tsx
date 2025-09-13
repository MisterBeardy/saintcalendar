"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Eye, Search, Upload, FileImage, Edit, Trash2 } from "lucide-react"
import { usePendingChangesByEntity } from "@/hooks/use-pending-changes-by-entity"
import { PendingChangeBadge } from "@/components/ui/pending-change-badge"
import { DragDropZone, FileWithPreview } from "./sticker-upload/drag-drop-zone"
import { FileUploadService } from "@/lib/services/file-upload"
import { AssociationDialog, type StickerAssociation } from "./sticker-upload/association-dialog"
import { useSaintsData } from "@/hooks/useSaintsData"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useNotificationActions } from "@/components/admin/notification-system"

interface StickerSubmission {
  id: string
  saintName: string
  submittedBy: string
  submissionDate: string
  status: "pending" | "approved" | "rejected"
  location: string
  state: string
  historicalEvent: string
  imageUrl?: string
  notes?: string
}

interface StickerManagementProps {
  onNavigateToPending?: () => void;
}

export function StickerManagement({ onNavigateToPending }: StickerManagementProps) {
  // Notification system
  const { success } = useNotificationActions()

  // Upload state
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploading, setUploading] = useState(false)

  // Association dialog state
  const [associationDialogOpen, setAssociationDialogOpen] = useState(false)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [filesToAssociate, setFilesToAssociate] = useState<FileWithPreview[]>([])
  const [currentFile, setCurrentFile] = useState<FileWithPreview | null>(null)


  // Fetch sticker submissions from database
  const [stickerSubmissions, setStickerSubmissions] = useState<StickerSubmission[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch pending changes for stickers
  const { hasPendingChange } = usePendingChangesByEntity('STICKER')

  // Fetch saints and locations data for dropdowns
  const { saints, locations, saintsLoading, locationsLoading } = useSaintsData()

  const fetchStickerSubmissions = useCallback(async (statusFilter?: string) => {
    try {
      const url = statusFilter
        ? `/api/sticker-submissions?status=${statusFilter}`
        : '/api/sticker-submissions'
      const response = await fetch(url)
      if (response.ok) {
        const data: StickerSubmission[] = await response.json()
        setStickerSubmissions(data)
      }
    } catch (error) {
      console.error('Failed to fetch sticker submissions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStickerSubmissions('all')
  }, [fetchStickerSubmissions])
  const [selectedSubmission, setSelectedSubmission] = useState<StickerSubmission | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedStickerForEdit, setSelectedStickerForEdit] = useState<StickerSubmission | null>(null)
  const [selectedStickerForDelete, setSelectedStickerForDelete] = useState<StickerSubmission | null>(null)

  // Edit form state
  const [editSaintId, setEditSaintId] = useState("")
  const [editLocationId, setEditLocationId] = useState("")
  const [editMilestone, setEditMilestone] = useState("")
  const [editYear, setEditYear] = useState("")
  const [editImageUrl, setEditImageUrl] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState("")

  // Milestone dropdown state
  const [milestoneOptions, setMilestoneOptions] = useState<string[]>([])
  const [milestoneLoading, setMilestoneLoading] = useState(false)
  const [yearAutoPopulated, setYearAutoPopulated] = useState(false)

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  // Fetch milestone options for selected saint
  const fetchMilestoneOptions = useCallback(async (saintId: string) => {
    if (!saintId) {
      setMilestoneOptions([])
      return
    }

    setMilestoneLoading(true)
    try {
      const response = await fetch(`/api/saints/${saintId}/milestones`)
      if (response.ok) {
        const options: string[] = await response.json()
        setMilestoneOptions(options)
      } else {
        console.error('Failed to fetch milestone options')
        setMilestoneOptions([])
      }
    } catch (error) {
      console.error('Error fetching milestone options:', error)
      setMilestoneOptions([])
    } finally {
      setMilestoneLoading(false)
    }
  }, [])

  // Extract year from milestone description
  const extractYearFromMilestone = (milestone: string): string => {
    // Try to match date patterns: YYYY-MM-DD or YYYY
    const dateMatch = milestone.match(/(\d{4})(?:-(\d{2})-(\d{2}))?/)
    if (dateMatch) {
      return dateMatch[1] // Return the year (YYYY)
    }
    return ""
  }

  // Handle milestone selection
  const handleMilestoneChange = (value: string) => {
    if (value === "custom") {
      // Allow custom entry - don't change the milestone value yet
      setEditMilestone("")
      setEditYear("")
      setYearAutoPopulated(false)
    } else {
      setEditMilestone(value)

      if (value) {
        const extractedYear = extractYearFromMilestone(value)
        if (extractedYear) {
          setEditYear(extractedYear)
          setYearAutoPopulated(true)
        }
      } else {
        // Clear year if no milestone selected
        setEditYear("")
        setYearAutoPopulated(false)
      }
    }
  }

  // Handle manual year change
  const handleYearChange = (value: string) => {
    setEditYear(value)
    setYearAutoPopulated(false) // Mark as manually entered
  }

  const filteredSubmissions = stickerSubmissions.filter((submission) => {
    const matchesStatus = filterStatus === "all" || submission.status === filterStatus
    const matchesSearch =
      submission.saintName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.location.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch('/api/sticker-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action: 'approve' }),
      })

      if (response.ok) {
        // Refresh the submissions list
        await fetchStickerSubmissions('all')
      } else {
        console.error('Failed to approve submission')
      }
    } catch (error) {
      console.error('Error approving submission:', error)
    }
  }

  const handleReject = async (id: string) => {
    try {
      const response = await fetch('/api/sticker-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action: 'reject' }),
      })

      if (response.ok) {
        // Refresh the submissions list
        await fetchStickerSubmissions('all')
      } else {
        console.error('Failed to reject submission')
      }
    } catch (error) {
      console.error('Error rejecting submission:', error)
    }
  }

  // Edit sticker handler
  const handleEditSticker = async () => {
    if (!selectedStickerForEdit) return

    setEditLoading(true)
    setEditError("")

    try {
      const response = await fetch(`/api/stickers/${selectedStickerForEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saintId: editSaintId,
          locationId: editLocationId,
          milestone: editMilestone,
          year: editYear,
          imageUrl: editImageUrl
        }),
      })

      if (response.ok) {
        // Refresh the submissions list
        await fetchStickerSubmissions('all')
        setEditModalOpen(false)
        setSelectedStickerForEdit(null)
        // Reset form
        setEditSaintId("")
        setEditLocationId("")
        setEditMilestone("")
        setEditYear("")
        setEditImageUrl("")
        setMilestoneOptions([])
        setYearAutoPopulated(false)
        // Show success message
        success(
          'Sticker Updated',
          'Status has been reset to "Pending" for re-approval.'
        )
      } else {
        const errorData = await response.json()
        setEditError(errorData.error || 'Failed to update sticker')
      }
    } catch (error) {
      console.error('Error updating sticker:', error)
      setEditError('Network error occurred')
    } finally {
      setEditLoading(false)
    }
  }

  // Delete sticker handler
  const handleDeleteSticker = async () => {
    if (!selectedStickerForDelete) return

    setDeleteLoading(true)
    setDeleteError("")

    try {
      const response = await fetch(`/api/stickers/${selectedStickerForDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh the submissions list
        await fetchStickerSubmissions('all')
        setDeleteModalOpen(false)
        setSelectedStickerForDelete(null)
      } else {
        const errorData = await response.json()
        setDeleteError(errorData.error || 'Failed to delete sticker')
      }
    } catch (error) {
      console.error('Error deleting sticker:', error)
      setDeleteError('Network error occurred')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Initialize edit form when sticker is selected
  useEffect(() => {
    if (selectedStickerForEdit) {
      // Find the current saint and location to pre-populate form
      const currentSaint = saints.find(s => s.saintName === selectedStickerForEdit.saintName)
      const currentLocation = locations.find(l => l.displayName === selectedStickerForEdit.location)

      setEditSaintId(currentSaint?.id || "")
      setEditLocationId(currentLocation?.id || "")
      setEditMilestone(selectedStickerForEdit.historicalEvent || "")
      setEditYear(selectedStickerForEdit.notes?.match(/Year: (\d+)/)?.[1] || "")
      setEditImageUrl(selectedStickerForEdit.imageUrl || "")
      setEditError("")
      setYearAutoPopulated(false)

      // Fetch milestone options for the selected saint
      if (currentSaint?.id) {
        fetchMilestoneOptions(currentSaint.id)
      }
    }
  }, [selectedStickerForEdit, saints, locations, fetchMilestoneOptions])

  // Fetch milestone options when saint changes
  useEffect(() => {
    if (editSaintId) {
      fetchMilestoneOptions(editSaintId)
    } else {
      setMilestoneOptions([])
    }
  }, [editSaintId, fetchMilestoneOptions])

  // Upload handling functions
  const handleFilesSelected = async (files: FileWithPreview[]) => {
    console.log('Files selected for upload:', files.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      hasPreview: !!f.preview
    })))
    setUploadedFiles(files)
    setFilesToAssociate(files)
    // Don't open dialog immediately - let user review files first
  }

  // Association handling functions
  const handleAssociation = async (association: StickerAssociation) => {
    const file = filesToAssociate[currentFileIndex]

    console.log('Starting upload for file:', {
      index: currentFileIndex + 1,
      total: filesToAssociate.length,
      fileId: file.id,
      fileName: file.name,
      hasPreview: !!file.preview,
      previewUrl: file.preview?.substring(0, 50) + '...',
      association
    })

    setUploading(true)
    try {
      const result = await FileUploadService.uploadFile(
        file.file,
        association,
        (progress) => {
          console.log('Upload progress:', file.name, progress.percentage + '%')
          setUploadProgress(prev => ({ ...prev, [file.id]: progress.percentage }))
        }
      )

      if (result.success) {
        console.log('File uploaded and associated successfully:', {
          fileId: file.id,
          fileName: file.name,
          result
        })

        // Move to next file or close dialog
        if (currentFileIndex < filesToAssociate.length - 1) {
          setCurrentFileIndex(prev => prev + 1)
          setCurrentFile(filesToAssociate[currentFileIndex + 1])
        } else {
          // All files processed
          console.log('All files processed successfully')
          setAssociationDialogOpen(false)
          setFilesToAssociate([])
          setCurrentFileIndex(0)
          setCurrentFile(null)
          alert(`All ${filesToAssociate.length} files uploaded and associated successfully!`)
          // Refresh the submissions list
          fetchStickerSubmissions('all')
        }
      } else {
        console.error('Upload failed:', result.error)
        alert(`Upload failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(prev => ({ ...prev, [file.id]: 0 }))
    }
  }

  const handleSkipAssociation = () => {
    // Move to next file or close dialog
    if (currentFileIndex < filesToAssociate.length - 1) {
      setCurrentFileIndex(prev => prev + 1)
      setCurrentFile(filesToAssociate[currentFileIndex + 1])
    } else {
      // All files processed
      setAssociationDialogOpen(false)
      setFilesToAssociate([])
      setCurrentFileIndex(0)
      setCurrentFile(null)
      alert(`${filesToAssociate.length} files processed!`)
    }
  }

  const clearAllFiles = useCallback(() => {
    // Don't clear files if association dialog is open
    if (associationDialogOpen) {
      console.log('Cannot clear files while association dialog is open')
      return
    }

    console.log('Clearing all files, marking URLs for cleanup for', uploadedFiles.length, 'files')
    // Mark URLs for cleanup instead of immediate revocation
    // URLs will be cleaned up by the drag-drop-zone component when files are actually removed
    setUploadedFiles([])
    setFilesToAssociate([])
    setCurrentFileIndex(0)
    setCurrentFile(null)
    setAssociationDialogOpen(false)
  }, [uploadedFiles, associationDialogOpen])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sticker Management</h2>
          <p className="text-muted-foreground">Upload new stickers and review submissions</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{filteredSubmissions.filter((s) => s.status === "pending").length} Pending</Badge>
        </div>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Stickers
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Review All
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Manage Stickers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="w-5 h-5" aria-hidden="true" />
                Upload New Stickers
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag and drop sticker files or click to browse. Supports PNG, JPG, GIF, and WebP formats (max 10MB each).
              </p>
            </CardHeader>
            <CardContent>
              <DragDropZone
                onFilesSelected={handleFilesSelected}
                maxFiles={10}
                maxFileSize={10}
                className="min-h-[250px] sm:min-h-[300px]"
                aria-label="Drag and drop sticker files here or click to browse"
              />
              {uploading && (
                <div
                  className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md"
                  role="status"
                  aria-live="polite"
                  aria-label="Upload progress"
                >
                  <p className="text-sm text-blue-700 font-medium">Uploading files...</p>
                  <div className="mt-3 space-y-2" role="list">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between text-sm"
                        role="listitem"
                      >
                        <span className="truncate flex-1 mr-2" title={file.name}>
                          {file.name}
                        </span>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-16 h-2 bg-blue-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 transition-all duration-300"
                              style={{ width: `${uploadProgress[file.id] || 0}%` }}
                              role="progressbar"
                              aria-label={`Upload progress for ${file.name}`}
                            />
                          </div>
                          <span className="text-blue-600 text-xs min-w-[2.5rem] text-right">
                            {uploadProgress[file.id] || 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Queue Actions */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                onClick={() => {
                  setFilesToAssociate(uploadedFiles)
                  setCurrentFileIndex(0)
                  setCurrentFile(uploadedFiles[0])
                  setAssociationDialogOpen(true)
                }}
                className="flex-1 sm:flex-none"
                disabled={uploadedFiles.length === 0}
              >
                <Upload className="w-4 h-4 mr-2" />
                Process All Valid ({uploadedFiles.length})
              </Button>
              <Button
                variant="outline"
                onClick={clearAllFiles}
                className="flex-1 sm:flex-none"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setUploadedFiles([])
                  setFilesToAssociate([])
                }}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Quick Test Buttons */}
          <div className="flex justify-center gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  // Fetch the actual Jack Browns Logo from the data folder
                  console.log('Fetching Jack Browns Logo...')
                  const response = await fetch('/api/test-image')

                  if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.status}`)
                  }

                  const blob = await response.blob()
                  const testFile = new File([blob], 'Jack-Browns-Logo.png', { type: 'image/png' })

                  const testFileWithPreview: FileWithPreview = {
                    file: testFile,
                    id: `test-${Date.now()}`,
                    name: testFile.name,
                    size: testFile.size,
                    type: testFile.type
                  }

                  // Create preview URL
                  testFileWithPreview.preview = URL.createObjectURL(testFile)
                  console.log('Test file created with preview:', testFileWithPreview.preview)

                  setUploadedFiles([testFileWithPreview])
                  setFilesToAssociate([testFileWithPreview])
                  setCurrentFileIndex(0)
                  setCurrentFile(testFileWithPreview)
                  setAssociationDialogOpen(true)
                } catch (error) {
                  console.error('Failed to load test image:', error)
                  alert('Failed to load test image. Check console for details.')
                }
              }}
              className="text-xs"
            >
              Test with Dialog
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                // Direct upload test
                const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
                const response = await fetch(dataUrl)
                const blob = await response.blob()
                const testFile = new File([blob], 'direct-test.png', { type: 'image/png' })

                console.log('Starting direct upload test...')
                setUploading(true)

                const result = await FileUploadService.uploadFile(testFile, {
                  saintId: 'test-saint',
                  locationId: 'test-location',
                  year: 2024,
                  milestone: 'Test Upload'
                }, (progress) => {
                  console.log('Direct upload progress:', progress.percentage + '%')
                })

                setUploading(false)

                if (result.success) {
                  console.log('Direct upload successful:', result)
                  alert('Direct upload successful!')
                } else {
                  console.error('Direct upload failed:', result.error)
                  alert('Direct upload failed: ' + result.error)
                }
              }}
              className="text-xs"
            >
              Direct Upload Test
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="review" className="space-y-6">

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("pending")}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("approved")}
              >
                Approved
              </Button>
              <Button
                variant={filterStatus === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("rejected")}
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Saint Name</th>
                  <th className="text-left p-3 font-medium">Submitted By</th>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-left p-3 font-medium">Historical Event</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{submission.saintName}</td>
                    <td className="p-3">{submission.submittedBy}</td>
                    <td className="p-3">
                      {submission.location}, {submission.state}
                    </td>
                    <td className="p-3">{submission.historicalEvent}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(submission.status)}
                        {hasPendingChange(submission.id) && (
                          <PendingChangeBadge onClick={onNavigateToPending} />
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(submission.submissionDate).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(submission)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <div className="flex flex-col gap-2 text-center sm:text-left mb-6">
                              <DialogTitle className="text-lg font-semibold">Review Submission</DialogTitle>
                              <p className="text-muted-foreground text-sm">
                                Review sticker submission details including saint information and submission data.
                              </p>
                            </div>
                            {selectedSubmission && (
                              <div className="space-y-4">
                                {selectedSubmission.imageUrl && (
                                  <div className="flex justify-center">
                                    <div className="w-full max-w-md">
                                      <img
                                        src={selectedSubmission.imageUrl}
                                        alt="Sticker preview"
                                        className="w-full max-h-64 object-contain border rounded-lg shadow-sm"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none'
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <label className="text-sm font-medium">Saint Name</label>
                                    <p className="text-sm text-muted-foreground">{selectedSubmission.saintName}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Submitted By</label>
                                    <p className="text-sm text-muted-foreground">{selectedSubmission.submittedBy}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Location</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedSubmission.location}, {selectedSubmission.state}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Historical Event</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedSubmission.historicalEvent}
                                    </p>
                                  </div>
                                </div>
                                {selectedSubmission.notes && (
                                  <div>
                                    <label className="text-sm font-medium">Notes</label>
                                    <p className="text-sm text-muted-foreground">{selectedSubmission.notes}</p>
                                  </div>
                                )}
                                <div className="flex gap-2 pt-4">
                                  <Button onClick={() => handleApprove(selectedSubmission.id)} className="flex-1">
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleReject(selectedSubmission.id)}
                                    className="flex-1"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        {submission.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(submission.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(submission.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search stickers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === "approved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("approved")}
                  >
                    Approved
                  </Button>
                  <Button
                    variant={filterStatus === "rejected" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("rejected")}
                  >
                    Rejected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stickers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Stickers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Saint Name</th>
                      <th className="text-left p-3 font-medium">Submitted By</th>
                      <th className="text-left p-3 font-medium">Location</th>
                      <th className="text-left p-3 font-medium">Historical Event</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Submission Date</th>
                      <th className="text-left p-3 font-medium">Image</th>
                      <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stickerSubmissions
                      .filter((submission) => submission.status === "approved" || submission.status === "rejected")
                      .filter((submission) => {
                        const matchesSearch =
                          submission.saintName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          submission.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          submission.location.toLowerCase().includes(searchTerm.toLowerCase())
                        return matchesSearch
                      })
                      .map((submission) => (
                        <tr key={submission.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{submission.saintName}</td>
                          <td className="p-3">{submission.submittedBy}</td>
                          <td className="p-3">
                            {submission.location}, {submission.state}
                          </td>
                          <td className="p-3">{submission.historicalEvent}</td>
                          <td className="p-3">
                            {getStatusBadge(submission.status)}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(submission.submissionDate).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            {submission.imageUrl && (
                              <img
                                src={submission.imageUrl}
                                alt="Sticker preview"
                                className="w-12 h-12 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1 justify-end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(submission)}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <div className="flex flex-col gap-2 text-center sm:text-left mb-6">
                                    <DialogTitle className="text-lg font-semibold">Sticker Details</DialogTitle>
                                    <p className="text-muted-foreground text-sm">
                                      View sticker submission details.
                                    </p>
                                  </div>
                                  {selectedSubmission && (
                                    <div className="space-y-4">
                                      {selectedSubmission.imageUrl && (
                                        <div className="flex justify-center">
                                          <div className="w-full max-w-md">
                                            <img
                                              src={selectedSubmission.imageUrl}
                                              alt="Sticker preview"
                                              className="w-full max-h-64 object-contain border rounded-lg shadow-sm"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                      <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                          <label className="text-sm font-medium">Saint Name</label>
                                          <p className="text-sm text-muted-foreground">{selectedSubmission.saintName}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Submitted By</label>
                                          <p className="text-sm text-muted-foreground">{selectedSubmission.submittedBy}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Location</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedSubmission.location}, {selectedSubmission.state}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Historical Event</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedSubmission.historicalEvent}
                                          </p>
                                        </div>
                                      </div>
                                      {selectedSubmission.notes && (
                                        <div>
                                          <label className="text-sm font-medium">Notes</label>
                                          <p className="text-sm text-muted-foreground">{selectedSubmission.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedStickerForEdit(submission)
                                  setEditModalOpen(true)
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedStickerForDelete(submission)
                                  setDeleteModalOpen(true)
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Sticker Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <div className="flex flex-col gap-2 text-center sm:text-left mb-6">
            <DialogTitle className="text-lg font-semibold">Edit Sticker</DialogTitle>
            <p className="text-muted-foreground text-sm">
              Update sticker details and associations.
            </p>
          </div>
          {selectedStickerForEdit && (
            <div className="space-y-6">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{editError}</p>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Editing this sticker will reset its status to "Pending" for re-approval.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-saint">Saint Name</Label>
                  <Select value={editSaintId} onValueChange={setEditSaintId} disabled={saintsLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a saint" />
                    </SelectTrigger>
                    <SelectContent>
                      {saints.map((saint) => (
                        <SelectItem key={saint.id} value={saint.id}>
                          {saint.saintName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Select value={editLocationId} onValueChange={setEditLocationId} disabled={locationsLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.displayName}, {location.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-milestone">Historical Event/Milestone</Label>
                  <Select
                    value={editMilestone}
                    onValueChange={handleMilestoneChange}
                    disabled={milestoneLoading || !editSaintId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={milestoneLoading ? "Loading milestones..." : "Select a milestone or enter manually"} />
                    </SelectTrigger>
                    <SelectContent>
                      {milestoneOptions.map((option, index) => (
                        <SelectItem key={index} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Enter custom milestone...</SelectItem>
                    </SelectContent>
                  </Select>
                  {milestoneOptions.length === 0 && !milestoneLoading && editSaintId && (
                    <p className="text-sm text-muted-foreground">
                      No milestones found for this saint. You can enter a custom milestone below.
                    </p>
                  )}
                  {editMilestone === "" && editSaintId && (
                    <Input
                      value={editMilestone}
                      onChange={(e) => setEditMilestone(e.target.value)}
                      placeholder="Enter custom milestone or historical event"
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-year">
                    Year {yearAutoPopulated && <span className="text-sm text-muted-foreground">(auto-populated)</span>}
                  </Label>
                  <Input
                    id="edit-year"
                    type="number"
                    value={editYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    placeholder="Enter year"
                    className={yearAutoPopulated ? "border-blue-300 bg-blue-50" : ""}
                  />
                  {yearAutoPopulated && (
                    <p className="text-xs text-muted-foreground">
                      Year was auto-populated from the selected milestone. You can edit it manually.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-image">Image URL</Label>
                  <Input
                    id="edit-image"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="Enter image URL or upload new image"
                  />
                </div>

              </div>

              {selectedStickerForEdit.imageUrl && (
                <div className="space-y-2">
                  <Label>Current Image</Label>
                  <div className="flex justify-center">
                    <img
                      src={selectedStickerForEdit.imageUrl}
                      alt="Current sticker"
                      className="max-w-32 max-h-32 object-contain border rounded"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleEditSticker}
                  disabled={editLoading || !editSaintId || !editLocationId}
                  className="flex-1"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditModalOpen(false)
                    setSelectedStickerForEdit(null)
                    setEditError("")
                    setMilestoneOptions([])
                    setYearAutoPopulated(false)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Sticker Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <div className="flex flex-col gap-2 text-center sm:text-left mb-6">
            <DialogTitle className="text-lg font-semibold">Delete Sticker</DialogTitle>
            <p className="text-muted-foreground text-sm">
              Are you sure you want to delete this sticker? This action cannot be undone.
            </p>
          </div>
          {selectedStickerForDelete && (
            <div className="space-y-4">
              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{deleteError}</p>
                </div>
              )}

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-sm font-medium">{selectedStickerForDelete.saintName}</p>
                  {getStatusBadge(selectedStickerForDelete.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Location: {selectedStickerForDelete.location}, {selectedStickerForDelete.state}
                </p>
                <p className="text-sm text-muted-foreground">
                  Submitted by {selectedStickerForDelete.submittedBy} on {new Date(selectedStickerForDelete.submissionDate).toLocaleDateString()}
                </p>
                {selectedStickerForDelete.historicalEvent && (
                  <p className="text-sm text-muted-foreground">
                    Event: {selectedStickerForDelete.historicalEvent}
                  </p>
                )}
              </div>

              {selectedStickerForDelete.imageUrl && (
                <div className="flex justify-center">
                  <img
                    src={selectedStickerForDelete.imageUrl}
                    alt="Sticker to delete"
                    className="max-w-24 max-h-24 object-contain border rounded"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="destructive"
                  onClick={handleDeleteSticker}
                  disabled={deleteLoading}
                  className="flex-1"
                >
                  {deleteLoading ? "Deleting..." : "Delete Sticker"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteModalOpen(false)
                    setSelectedStickerForDelete(null)
                    setDeleteError("")
                  }}
                  className="flex-1"
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Association Dialog */}
      <AssociationDialog
        open={associationDialogOpen}
        onOpenChange={setAssociationDialogOpen}
        stickerFile={currentFile}
        onAssociate={handleAssociation}
        onSkip={handleSkipAssociation}
        mode={filesToAssociate.length > 1 ? 'bulk' : 'single'}
        currentIndex={currentFileIndex + 1}
        totalCount={filesToAssociate.length}
      />
    </div>
  )
}
