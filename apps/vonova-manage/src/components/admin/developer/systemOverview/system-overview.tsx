"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Users, ShoppingCart, Activity, Clock, BarChart3, RefreshCw, LayoutDashboard, Gauge, HardDrive } from "lucide-react";
import { MetricCard } from "@/components/admin/developer/systemOverview/overview/metric-card";
import { SystemStatus } from "@/components/admin/developer/systemOverview/overview/system-status";
import { ResourceUsage } from "@/components/admin/developer/systemOverview/resources/resource-usage";
import { RecentActivity } from "@/components/admin/developer/systemOverview/overview/recent-activity";
import { TimeRangeSelector } from "@/components/admin/developer/systemOverview/time-range-selector";
import { MetricsCharts } from "@/components/admin/developer/systemOverview/performance/metrics-charts";
import { SystemAlerts } from "@/components/admin/developer/systemOverview/overview/system-alerts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAutoRefresh } from "@/hooks/admin/use-auto-refresh";
import { ActivityItemProps, TimeRange } from "./types";
import { getDashboardOverviewQueryFn } from '@/services/admin/admin.api';

export default function SystemOverview() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date());

  const {
    isAutoRefreshing,
    lastRefresh,
    refreshCount,
    triggerRefresh,
  } = useAutoRefresh(30);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard-overview', timeRange, customDate?.toISOString()],
    queryFn: () =>
      getDashboardOverviewQueryFn({
        range: timeRange,
        customDate: timeRange === 'custom' ? customDate?.toISOString() : undefined,
      }),
  });

  useEffect(() => {
    void refetch();
  }, [refreshCount, refetch]);

  const overview = data?.data;
  const activities: ActivityItemProps[] =
    overview?.recentActivity.map((item) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    })) ?? [];
  const alerts =
    overview?.alerts.map((alert) => ({
      ...alert,
      timestamp: new Date(alert.timestamp),
      acknowledged: false,
    })) ?? [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => triggerRefresh()}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-4 w-4" />
              {lastRefresh ? `Updated ${formatDistanceToNow(lastRefresh, { addSuffix: true })}` : 'Loading...'}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Monitor your system&apos;s health and performance
          </p>
          <TimeRangeSelector
            range={timeRange}
            onRangeChange={setTimeRange}
            customDate={customDate}
            onCustomDateChange={setCustomDate}
          />
        </div>
      </div>

      {/* Tabs for different metric views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Users"
              value={overview?.metrics.totalUsers.toLocaleString() ?? (isLoading ? '...' : '0')}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricCard
              title="Active Sessions"
              value={overview?.metrics.activeSessions.toLocaleString() ?? (isLoading ? '...' : '0')}
              icon={<Activity className="h-4 w-4" />}
            />
            <MetricCard
              title="Tickets Today"
              value={overview?.metrics.ticketsToday.toLocaleString() ?? (isLoading ? '...' : '0')}
              icon={<ShoppingCart className="h-4 w-4" />}
            />
            <MetricCard
              title="API Response Time"
              value={
                overview?.metrics.avgResponseMs != null
                  ? `${overview.metrics.avgResponseMs}ms`
                  : (isLoading ? '...' : 'N/A')
              }
              icon={<Server className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* System Status */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <SystemStatus
                  statuses={
                    overview?.systemStatus ?? {
                      api: 'operational',
                      database: 'degraded',
                      authentication: 'operational',
                      fileStorage: 'degraded',
                      workers: 'operational',
                    }
                  }
                />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Uptime</span>
                  </div>
                  <span className="text-sm">{overview?.quickStats.uptimePercent.toFixed(2) ?? 'N/A'}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Server Version</span>
                  </div>
                  <span className="text-sm">{overview?.quickStats.serverVersion ?? 'unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Avg. Response</span>
                  </div>
                  <span className="text-sm">
                    {overview?.quickStats.avgResponseMs != null
                      ? `${overview.quickStats.avgResponseMs}ms`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Active Users (24h)</span>
                  </div>
                  <span className="text-sm">{overview?.quickStats.activeUsers24h.toLocaleString() ?? '0'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentActivity activities={activities} />
              </CardContent>
            </Card>
          </div>

          {/* System Alerts */}
          <SystemAlerts initialAlerts={alerts} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <MetricsCharts
            timeRange={timeRange}
            customDate={customDate}
            responseTimeData={overview?.performance.responseTime ?? []}
            errorRateData={overview?.performance.errorRate ?? []}
            requestStatus={
              overview?.performance.requestStatus ?? {
                success: 0,
                clientErrors: 0,
                serverErrors: 0,
                timeouts: 0,
              }
            }
          />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResourceUsage
                  resources={
                    overview?.resources ?? {
                      cpu: { usedPercent: 0, totalPercent: 100 },
                      memory: { usedBytes: 0, totalBytes: 1 },
                      disk: null,
                    }
                  }
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <SystemStatus
                  statuses={
                    overview?.systemStatus ?? {
                      api: 'operational',
                      database: 'degraded',
                      authentication: 'operational',
                      fileStorage: 'degraded',
                      workers: 'operational',
                    }
                  }
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}