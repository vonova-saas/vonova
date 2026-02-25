import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Clock, User, Settings, ShoppingCart, MessageSquare } from "lucide-react"
import { Activity } from "../types"

interface UserActivityLogProps {
  activities: Activity[]
  className?: string
}

export function UserActivityLog({ activities, className }: UserActivityLogProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4 text-blue-500" />
      case 'system':
        return <Settings className="h-4 w-4 text-purple-500" />
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-green-500" />
      case 'message':
        return <MessageSquare className="h-4 w-4 text-amber-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityVariant = (type: string) => {
    switch (type) {
      case 'user':
        return 'outline'
      case 'system':
        return 'secondary'
      case 'order':
        return 'default'
      case 'message':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {activities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                  {activity.details && (
                    <p className="text-sm text-muted-foreground">{activity.details}</p>
                  )}
                  {activity.ipAddress && (
                    <div className="mt-1">
                      <Badge variant={getActivityVariant(activity.type)} className="text-xs">
                        IP: {activity.ipAddress}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              <p>No activity found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
