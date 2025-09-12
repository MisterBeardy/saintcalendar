"use client"

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Check, X, Eye, Search } from "lucide-react"

interface StickerSubmission {
  id: string
  saintName: string
  submittedBy: string
  submissionDate: string
  status: "pending" | "approved" | "rejected"
  location: string
  state: string
  beerCount: number
  imageUrl?: string
  notes?: string
}

// Fetch sticker submissions from database
const [stickerSubmissions, setStickerSubmissions] = useState<StickerSubmission[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetchStickerSubmissions = async () => {
    try {
      const response = await fetch('/api/sticker-submissions')
      if (response.ok) {
        const data: StickerSubmission[] = await response.json()
        setStickerSubmissions(data)
      }
    } catch (error) {
      console.error('Failed to fetch sticker submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  fetchStickerSubmissions()
}, [])

export function StickerManagement() {
  const [selectedSubmission, setSelectedSubmission] = useState<StickerSubmission | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

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

  const handleApprove = (id: string) => {
    console.log(`Approving submission ${id}`)
    // Implementation would update the submission status
  }

  const handleReject = (id: string) => {
    console.log(`Rejecting submission ${id}`)
    // Implementation would update the submission status
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sticker Management</h2>
          <p className="text-muted-foreground">Review and approve saint sticker submissions</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{filteredSubmissions.filter((s) => s.status === "pending").length} Pending</Badge>
        </div>
      </div>

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
                  <th className="text-left p-3 font-medium">Beer Count</th>
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
                    <td className="p-3">{submission.beerCount.toLocaleString()}</td>
                    <td className="p-3">{getStatusBadge(submission.status)}</td>
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
                          <DialogContent aria-describedby="sticker-review-description">
                            <DialogHeader>
                              <DialogTitle>Review Submission</DialogTitle>
                              <DialogDescription id="sticker-review-description" className="text-gray-600 mt-2">
                                Review sticker submission details including saint information and submission data.
                              </DialogDescription>
                            </DialogHeader>
                            {selectedSubmission && (
                              <div className="space-y-4">
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
                                    <label className="text-sm font-medium">Beer Count</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedSubmission.beerCount.toLocaleString()}
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
    </div>
  )
}
