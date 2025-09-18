import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Info, Zap } from "lucide-react";
import { ActivityItemProps } from "../types";

function getActivityIcon(type: ActivityItemProps['type']) {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
}

function getActivityBadge(type: ActivityItemProps['type']) {
  const baseClass = 'text-xs';
  
  switch (type) {
    case 'success':
      return <Badge className={`${baseClass} bg-green-100 text-green-800`}>Success</Badge>;
    case 'warning':
      return <Badge className={`${baseClass} bg-yellow-100 text-yellow-800`}>Warning</Badge>;
    case 'error':
      return <Badge className={`${baseClass} bg-red-100 text-red-800`}>Error</Badge>;
    case 'info':
    default:
      return <Badge className={`${baseClass} bg-blue-100 text-blue-800`}>Info</Badge>;
  }
}

function formatTimeAgo(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function ActivityItem({ type, title, description, timestamp }: ActivityItemProps) {
  return (
    <div className="flex items-start space-x-3 py-2">
      <div className="mt-0.5">
        {getActivityIcon(type)}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{title}</h4>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(timestamp)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        {getActivityBadge(type)}
      </div>
    </div>
  );
}

export function RecentActivity() {
  // In a real app, this would come from an API
  const activities: ActivityItemProps[] = [
    {
      id: '1',
      type: 'success',
      title: 'Backup completed',
      description: 'Nightly database backup completed successfully',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: '2',
      type: 'warning',
      title: 'High memory usage',
      description: 'Memory usage is above 80%',
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    },
    {
      id: '3',
      type: 'info',
      title: 'New deployment',
      description: 'Version 1.2.0 deployed to production',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    },
    {
      id: '4',
      type: 'info',
      title: 'Scheduled maintenance',
      description: 'System maintenance scheduled for tomorrow at 2:00 AM',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Recent Activity</CardTitle>
        <Zap className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="h-[300px] overflow-y-auto">
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} {...activity} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
