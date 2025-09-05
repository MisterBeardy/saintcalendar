"use client"

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Search, MoreHorizontal, Shield, User } from "lucide-react"

interface UserAccount {
  id: string
  username: string
  email: string
  role: "admin" | "moderator" | "user"
  status: "active" | "inactive" | "pending"
  joinDate: string
  lastActive: string
  submissionsCount: number
}

const userAccounts: UserAccount[] = [
  {
    id: "1",
    username: "admin",
    email: "admin@oneofus.beer",
    role: "admin",
    status: "active",
    joinDate: "2024-01-01",
    lastActive: "2 minutes ago",
    submissionsCount: 15,
  },
  {
    id: "2",
    username: "beerfan42",
    email: "beerfan42@email.com",
    role: "user",
    status: "active",
    joinDate: "2024-03-15",
    lastActive: "1 hour ago",
    submissionsCount: 8,
  },
  {
    id: "3",
    username: "saint_hopper",
    email: "hopper@email.com",
    role: "user",
    status: "active",
    joinDate: "2024-05-20",
    lastActive: "3 hours ago",
    submissionsCount: 12,
  },
  {
    id: "4",
    username: "sticker_maker",
    email: "maker@email.com",
    role: "user",
    status: "pending",
    joinDate: "2024-08-15",
    lastActive: "Never",
    submissionsCount: 0,
  },
  {
    id: "5",
    username: "moderator1",
    email: "mod1@oneofus.beer",
    role: "moderator",
    status: "active",
    joinDate: "2024-02-10",
    lastActive: "30 minutes ago",
    submissionsCount: 5,
  },
]

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredUsers = userAccounts.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    const matchesStatus = filterStatus === "all" || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-red-100 text-red-800">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        )
      case "moderator":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Shield className="h-3 w-3 mr-1" />
            Moderator
          </Badge>
        )
      case "user":
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <User className="h-3 w-3 mr-1" />
            User
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* User Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{userAccounts.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{userAccounts.filter((u) => u.status === "active").length}</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{userAccounts.filter((u) => u.status === "pending").length}</p>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {userAccounts.filter((u) => u.role === "admin" || u.role === "moderator").length}
              </p>
              <p className="text-sm text-muted-foreground">Administrators</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Join Date</th>
                  <th className="text-left p-3 font-medium">Last Active</th>
                  <th className="text-left p-3 font-medium">Submissions</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-3">{getRoleBadge(user.role)}</td>
                    <td className="p-3">{getStatusBadge(user.status)}</td>
                    <td className="p-3 text-muted-foreground">{new Date(user.joinDate).toLocaleDateString()}</td>
                    <td className="p-3 text-muted-foreground">{user.lastActive}</td>
                    <td className="p-3">{user.submissionsCount}</td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-3 w-3" />
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
    </div>
  )
}
