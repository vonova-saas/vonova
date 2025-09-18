import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Calendar, Shield, Activity } from "lucide-react"
import { UserDetailsProps } from "../types"

export function UserDetails({ user, onEdit }: UserDetailsProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'suspended':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">User Details</CardTitle>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit User
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Role</span>
            </div>
            <p className="text-sm">
              <Badge variant="outline">{user.role}</Badge>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <p className="text-sm">
              <Badge variant={getStatusVariant(user.status)}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </Badge>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Last Active</span>
            </div>
            <p className="text-sm">{user.lastActive}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Member Since</span>
            </div>
            <p className="text-sm">{user.joinedDate}</p>
          </div>
        </div>

        {(user.totalOrders !== undefined || user.totalSpent !== undefined) && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-4">Activity Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.totalOrders !== undefined && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{user.totalOrders}</p>
                </div>
              )}
              {user.totalSpent !== undefined && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">${user.totalSpent?.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
