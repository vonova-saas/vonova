'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock, X, Zap } from "lucide-react";
import { useState } from "react";
import { SystemAlert } from "../types";

const alertIcons = {
  error: AlertCircle,
  warning: AlertCircle,
  info: Zap,
  success: CheckCircle2,
};

const alertVariants = {
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    iconColor: 'text-green-600 dark:text-green-400',
  },
};

export function SystemAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'error',
      title: 'High Error Rate',
      description: 'API error rate has exceeded 10% in the last 15 minutes',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      acknowledged: false,
    },
    {
      id: '2',
      type: 'warning',
      title: 'Memory Usage High',
      description: 'Server memory usage is at 85%',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      acknowledged: false,
    },
    {
      id: '3',
      type: 'info',
      title: 'New Version Available',
      description: 'Update to v1.3.0 is available',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      acknowledged: true,
    },
  ]);

  const acknowledgeAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const hasAlerts = unacknowledgedAlerts.length > 0;

  if (!hasAlerts) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-800 dark:text-green-200">All systems operational</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          No active alerts to display
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Active Alerts</h3>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          View all alerts
        </Button>
      </div>
      
      <div className="space-y-2">
        {unacknowledgedAlerts.map((alert) => {
          const Icon = alertIcons[alert.type];
          const variant = alertVariants[alert.type];
          
          return (
            <Alert 
              key={alert.id}
              className={`${variant.bg} ${variant.border} relative overflow-hidden`}
            >
              <div className="absolute left-0 top-0 h-full w-1 bg-current opacity-20"></div>
              <div className="flex items-start">
                <Icon className={`mt-0.5 mr-3 h-5 w-5 ${variant.iconColor}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <AlertTitle className={`${variant.text} font-medium`}>
                      {alert.title}
                    </AlertTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full text-muted-foreground hover:bg-transparent hover:text-foreground"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                      <span className="sr-only">Dismiss</span>
                    </Button>
                  </div>
                  <AlertDescription className={`${variant.text} mt-1`}>
                    {alert.description}
                  </AlertDescription>
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {formatTimeAgo(alert.timestamp)}
                  </div>
                </div>
              </div>
            </Alert>
          );
        })}
      </div>
    </div>
  );
}
