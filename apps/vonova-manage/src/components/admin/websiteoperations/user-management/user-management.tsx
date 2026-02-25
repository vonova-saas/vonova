"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutDashboard, Search, Users, UserPlus, Filter, Download, Upload, Settings } from "lucide-react"
import { UserTable } from "@/components/admin/websiteoperations/user-management/users/user-table"
import { UserDetails } from "@/components/admin/websiteoperations/user-management/users/user-details"
import { UserActivityLog } from "@/components/admin/websiteoperations/user-management/users/user-activity-log"
import { UserForm } from "@/components/admin/websiteoperations/user-management/users/user-form"
import { UserStatistics } from "./overview/user-statistics"
import { UserActivityTimeline, mockTimelineEvents } from "./overview/user-activity-timeline"
import { useToast } from "@/hooks"
import { User } from "./types"
import { mockUsers, mockActivities } from "./data/mock-data"

// Mock data for statistics
const mockUserActivity = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  active: Math.floor(Math.random() * 100) + 50,
  newUsers: Math.floor(Math.random() * 20) + 5,
}))

const mockRoleDistribution = [
  { id: 'admin', label: 'Admins', value: 15, color: '#3b82f6' },
  { id: 'moderator', label: 'Moderators', value: 25, color: '#8b5cf6' },
  { id: 'user', label: 'Users', value: 60, color: '#10b981' },
]

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateUser = () => {
    setIsCreating(true)
    setSelectedUser(null)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditing(true)
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId))
    if (selectedUser?.id === userId) {
      setSelectedUser(null)
    }
    toast({
      title: "User deleted",
      description: "The user has been removed from the system.",
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveUser = (data: any) => {
    if (isCreating) {
      const newUser: User = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        lastActive: 'Just now',
        joinedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        totalOrders: 0,
        totalSpent: 0
      }
      setUsers([...users, newUser])
      setSelectedUser(newUser)
      toast({
        title: "User created",
        description: `Successfully created user ${data.name}`,
      })
    } else if (selectedUser) {
      const updatedUsers = users.map(user =>
        user.id === selectedUser.id ? { ...user, ...data } : user
      )
      setUsers(updatedUsers)
      setSelectedUser({ ...selectedUser, ...data })
      toast({
        title: "User updated",
        description: `Successfully updated ${data.name}'s profile`,
      })
    }

    setIsCreating(false)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setIsEditing(false)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage users, roles, and permissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" onClick={handleCreateUser}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4"/>
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Roles & Permissions
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={activeTab === 'users' ? 'Search users...' : 'Search...'}
                className="w-full bg-background pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <UserStatistics 
            userActivity={mockUserActivity}
            roleDistribution={mockRoleDistribution}
          />
          
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <UserActivityTimeline events={mockTimelineEvents} />
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add New User
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Export Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Roles
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Users</span>
                    <span className="font-medium">1,234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Today</span>
                    <span className="font-medium">342</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">New This Week</span>
                    <span className="font-medium">87</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {isCreating || isEditing ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{isCreating ? 'Create New User' : 'Edit User'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <UserForm
                    defaultValues={selectedUser || undefined}
                    onSubmit={handleSaveUser}
                    onCancel={handleCancel}
                  />
                </CardContent>
              </Card>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Configure detailed permissions for this user.
                      {isCreating && ' Save the user first to configure permissions.'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : selectedUser ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4">
                <UserDetails
                  user={selectedUser}
                  onEdit={() => handleEditUser(selectedUser)}
                />
                <UserActivityLog
                  activities={mockActivities}
                  className="md:col-span-2"
                />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      Send Message
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Reset Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      View Orders
                    </Button>
                    {selectedUser.status === 'suspended' ? (
                      <Button variant="outline" className="w-full justify-start text-green-600">
                        Activate Account
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full justify-start text-destructive">
                        Suspend Account
                      </Button>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>User Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Configure detailed permissions for this user.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <UserTable
                users={filteredUsers}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onCreate={handleCreateUser}
              />
            </div>
          )}
        </TabsContent>
        
        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage user roles and their associated permissions.
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="p-6 text-center">
                  <h3 className="text-lg font-medium">Roles Management</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Coming soon. This section will allow you to manage user roles and permissions.
                  </p>
                  <Button className="mt-4">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Roles
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}