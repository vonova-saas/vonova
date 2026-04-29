"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Search, Users, UserPlus, Filter, Download, Upload, Settings, ChevronLeft, ChevronRight, ArrowLeft, Power, PowerOff, Loader2, Mail, Shield, Activity, Calendar, User, GraduationCap } from "lucide-react"
import { UserTable } from "@/components/admin/websiteoperations/user-management/users/user-table"
import { UserActivityLog } from "@/components/admin/websiteoperations/user-management/users/user-activity-log"
import { PendingInstructors } from "@/components/admin/websiteoperations/user-management/instructors/pending-instructors"
import { UserForm } from "@/components/admin/websiteoperations/user-management/users/user-form"
import { UserStatistics } from "./overview/user-statistics"
import { UserActivityTimeline, mockTimelineEvents } from "./overview/user-activity-timeline"
import { useToast } from "@/hooks/use-toast"
import { User as UserType } from "./types"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUsersQueryFn, getUserQueryFn, updateUserStatusMutationFn } from "@/services"
import { getUserManagementOverviewQueryFn, deleteUserMutationFn, updateUserMutationFn } from "@/services/admin/admin.api"
import { AdminUser } from "@/types/api/admin/admin.type"

// Helper function to map API role to form role
const mapApiRoleToFormRole = (apiRole: string): UserType['role'] => {
  const roleMap: Record<string, UserType['role']> = {
    'ADMIN': 'admin',
    'STUDENT_USER': 'student',
    'INSTRUCTOR_USER': 'instructor',
    'PENDING': 'student',
  }
  return roleMap[apiRole] || 'student'
}

// Helper function to map AdminUser to User format
const mapAdminUserToUser = (adminUser: AdminUser): UserType => ({
  id: adminUser._id,
  name: adminUser.name,
  email: adminUser.email,
  role: mapApiRoleToFormRole(adminUser.role),
  status: adminUser.isActive ? 'active' : 'inactive',
  lastActive: adminUser.lastSeenAt ? new Date(adminUser.lastSeenAt).toLocaleString() : 'Never',
  joinedDate: new Date(adminUser.createdAt).toLocaleDateString(),
})

// Helper function to format role for display
const formatRole = (role: string) => {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export default function UserManagement() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [roleFilter] = useState<string>('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch users list from API
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['adminUsers', page, limit, roleFilter, searchQuery],
    queryFn: () => getUsersQueryFn({
      page,
      limit,
      role: roleFilter || undefined,
      search: searchQuery || undefined,
    }),
    placeholderData: (previousData) => previousData,
  })

  const { data: overviewData } = useQuery({
    queryKey: ['userManagementOverview'],
    queryFn: getUserManagementOverviewQueryFn,
  })

  // Fetch single user details when selected
  const { data: userDetailData, isLoading: isLoadingUserDetail } = useQuery({
    queryKey: ['adminUser', selectedUserId],
    queryFn: () => getUserQueryFn(selectedUserId!),
    enabled: !!selectedUserId && !isCreating && !isEditing,
  })

  // Update user status mutation (suspend/restore)
  const updateStatusMutation = useMutation({
    mutationFn: updateUserStatusMutationFn,
    onSuccess: (data, variables) => {
      const action = variables.isActive ? 'activated' : 'suspended'
      toast({
        title: `User ${action}`,
        description: `The user has been ${action} successfully.`,
      })
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      queryClient.invalidateQueries({ queryKey: ['adminUser', variables.userId] })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: deleteUserMutationFn,
    onSuccess: (data, variables) => {
      toast({
        title: "User deleted",
        description: `${data.data.name} has been permanently removed from the system.`,
      })
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      // If we're viewing the deleted user, go back to list
      if (selectedUserId === variables) {
        setSelectedUserId(null)
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, updateData }: { userId: string; updateData: Record<string, unknown> }) =>
      updateUserMutationFn(userId, updateData),
    onSuccess: (data, variables) => {
      toast({
        title: "User updated",
        description: `${data.data.name}'s information has been updated successfully.`,
      })
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      queryClient.invalidateQueries({ queryKey: ['adminUser', variables.userId] })
      setIsEditing(false)
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      })
    },
  })

  const users = usersData?.data.users.map(mapAdminUserToUser) || []
  const pagination = usersData?.data.pagination

  // Get detailed user data
  const selectedUserDetail = userDetailData?.data
    ? mapAdminUserToUser(userDetailData.data)
    : null

  const handleViewUser = (user: UserType) => {
    setSelectedUserId(user.id)
    setIsCreating(false)
    setIsEditing(false)
  }

  const handleCreateUser = () => {
    setIsCreating(true)
    setSelectedUserId(null)
  }

  const handleEditUser = (user: UserType) => {
    setSelectedUserId(user.id)
    setIsEditing(true)
  }

  const handleDeleteUser = (userId: string) => {
    // Show confirmation dialog before deleting
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId)
    }
  }

  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    updateStatusMutation.mutate({
      userId,
      isActive: !currentStatus,
    })
  }

  const handleBackToList = () => {
    setSelectedUserId(null)
    setIsCreating(false)
    setIsEditing(false)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveUser = (data: any) => {
    if (isCreating) {
      toast({
        title: "User created",
        description: `Successfully created user ${data.name}`,
      })
    } else if (selectedUserId) {
      // Map form data to API format
      const updateData = {
        name: data.name,
        email: data.email,
        role: data.role === 'admin' ? 'ADMIN' :
          data.role === 'instructor' ? 'INSTRUCTOR_USER' : 'STUDENT_USER',
        isActive: data.status === 'active',
        bio: data.bio,
        phone: data.phone,
        address: data.address,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      }

      updateUserMutation.mutate({
        userId: selectedUserId,
        updateData
      })
    }

    if (isCreating) {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setIsEditing(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setPage(1) // Reset to first page on search
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
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="instructors" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Pending Instructors
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
                onChange={handleSearchChange}
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
            userActivity={overviewData?.data.userActivity ?? []}
            roleDistribution={overviewData?.data.roleDistribution ?? []}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <UserActivityTimeline events={overviewData?.data.timeline ?? mockTimelineEvents} />
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
                    <span className="font-medium">{overviewData?.data.quickStats.totalUsers ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Today</span>
                    <span className="font-medium">{overviewData?.data.quickStats.activeToday ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">New This Week</span>
                    <span className="font-medium">{overviewData?.data.quickStats.newThisWeek ?? 0}</span>
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
                    defaultValues={selectedUserDetail || undefined}
                    onSubmit={handleSaveUser}
                    onCancel={handleCancel}
                    isSubmitting={updateUserMutation.isPending}
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
          ) : selectedUserId ? (
            <div className="space-y-4">
              {/* Back Button */}
              <Button variant="outline" onClick={handleBackToList} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Users
              </Button>

              {isLoadingUserDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : selectedUserDetail ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Main User Info */}
                  <div className="md:col-span-2 space-y-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                          <CardTitle className="text-2xl font-bold">User Details</CardTitle>
                          <CardDescription>View and manage user information</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditUser(selectedUserDetail)}>
                            Edit User
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(selectedUserDetail.id)}
                            disabled={deleteUserMutation.isPending}
                          >
                            {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-4">
                        {/* User Header */}
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                            <User className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{selectedUserDetail.name}</h3>
                            <p className="text-sm text-muted-foreground">{selectedUserDetail.email}</p>
                          </div>
                        </div>

                        {/* User Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Role</span>
                            </div>
                            <Badge variant="outline">{formatRole(selectedUserDetail.role)}</Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Status</span>
                            </div>
                            <Badge variant={selectedUserDetail.status === 'active' ? 'default' : selectedUserDetail.status === 'suspended' ? 'destructive' : 'secondary'}>
                              {selectedUserDetail.status.charAt(0).toUpperCase() + selectedUserDetail.status.slice(1)}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Last Active</span>
                            </div>
                            <p className="text-sm">{selectedUserDetail.lastActive}</p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Member Since</span>
                            </div>
                            <p className="text-sm">{selectedUserDetail.joinedDate}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <UserActivityLog
                      activities={overviewData?.data.recentActivity ?? []}
                      className="md:col-span-2"
                    />
                  </div>

                  {/* Sidebar Actions */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <Mail className="mr-2 h-4 w-4" />
                          Send Message
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          Reset Password
                        </Button>

                        {/* Suspend/Activate Button */}
                        {updateStatusMutation.isPending ? (
                          <Button variant="outline" className="w-full justify-start" disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </Button>
                        ) : userDetailData?.data?.isActive ? (
                          <Button
                            variant="outline"
                            className="w-full justify-start text-destructive hover:text-destructive"
                            onClick={() => handleToggleUserStatus(selectedUserId, true)}
                          >
                            <PowerOff className="mr-2 h-4 w-4" />
                            Suspend Account
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full justify-start text-green-600 hover:text-green-600"
                            onClick={() => handleToggleUserStatus(selectedUserId, false)}
                          >
                            <Power className="mr-2 h-4 w-4" />
                            Activate Account
                          </Button>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Account Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Verified</span>
                          <Badge variant={userDetailData?.data?.isVerified ? 'default' : 'secondary'}>
                            {userDetailData?.data?.isVerified ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Active</span>
                          <Badge variant={userDetailData?.data?.isActive ? 'default' : 'destructive'}>
                            {userDetailData?.data?.isActive ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Online</span>
                          <Badge variant={userDetailData?.data?.isOnline ? 'default' : 'secondary'}>
                            {userDetailData?.data?.isOnline ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">User not found</p>
                    <Button variant="outline" onClick={handleBackToList} className="mt-4">
                      Back to Users
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {isLoading && <p className="text-center py-4">Loading users...</p>}
              {error && <p className="text-center py-4 text-red-500">Failed to load users. Please try again.</p>}
              {!isLoading && !error && (
                <>
                  <UserTable
                    users={users}
                    onView={handleViewUser}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    onCreate={handleCreateUser}
                  />
                  {/* Pagination */}
                  {pagination && pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-2 py-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                          Page {pagination.page} of {pagination.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page === pagination.pages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </TabsContent>

        {/* Pending Instructors Tab */}
        <TabsContent value="instructors" className="space-y-4">
          <PendingInstructors />
        </TabsContent>
      </Tabs>
    </div>
  )
}