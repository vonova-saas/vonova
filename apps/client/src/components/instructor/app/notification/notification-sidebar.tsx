"use client";

import * as React from "react";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Bell, CheckCircle2, AlertCircle, Info, Zap, X, Check, Settings, BellOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Notification, NotificationType } from "./types";
import { mockNotifications } from "./mock-notifications";
import Link from "next/link";

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    case 'warning':
      return <AlertCircle className="h-3 w-3 text-amber-500" />;
    case 'system':
      return <Zap className="h-3 w-3 text-blue-500" />;
    default:
      return <Info className="h-3 w-3 text-blue-400" />;
  }
};

export function NotificationSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [notifications, setNotifications] = React.useState<Notification[]>(mockNotifications);
  const [showUnreadOnly, setShowUnreadOnly] = React.useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayedNotifications = showUnreadOnly
    ? notifications.filter(n => !n.read)
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <Sidebar side="right" collapsible="offcanvas" variant="inset" {...props}>
      <SidebarContent className="flex flex-col">
        {/* Header */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1.5">
              <Bell className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={markAllAsRead} disabled={unreadCount === 0}>
                <Check className="h-3 w-3" />
                <span className="sr-only">Mark all as read</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearAll} disabled={notifications.length === 0}>
                <X className="h-3 w-3" />
                <span className="sr-only">Clear all</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <BellOff className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">Unread only</span>
            </div>
            <Switch
              checked={showUnreadOnly}
              onCheckedChange={setShowUnreadOnly}
              aria-label="Show unread only"
              className="h-4 w-7"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y">
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-muted/30 cursor-pointer' : ''}`}
              >
                <div className="flex gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {notification.avatar ? (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={notification.avatar} />
                        <AvatarFallback className="text-xs">{notification.user?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="text-xs font-medium leading-tight line-clamp-2">
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-1 ml-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(notification.time, { addSuffix: true }).replace('about ', '')}
                        </span>
                        {!notification.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.actionLabel && (
                      <div className="mt-2 flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            markAsRead(notification.id);
                            notification.action?.();
                          }}
                        >
                          {notification.actionLabel}
                        </Button>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <BellOff className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-sm font-medium mb-1">No notifications</h3>
              <p className="text-xs text-muted-foreground">
                {showUnreadOnly
                  ? "You're all caught up!"
                  : "You don't have any notifications yet."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-2 flex justify-between items-center mt-auto">
          <Link href="/dashboard/settings/notifications">
            <Button variant="ghost" size="sm" className="text-muted-foreground h-7 px-2">
              <Settings className="h-3 w-3 mr-1" />
              <span className="text-xs">Settings</span>
            </Button>
          </Link>
          <span className="text-xs text-muted-foreground">
            {unreadCount} unread • {notifications.length} total
          </span>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}