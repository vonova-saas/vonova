"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
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
import { TimeRange } from "./types";

export default function SystemOverview() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date());

  const {
    isAutoRefreshing,
    lastRefresh,
    refreshCount,
    triggerRefresh,
  } = useAutoRefresh(30);

  // Simulate data refresh when refreshCount changes
  useEffect(() => {
    // In a real app, you would fetch new data here
    console.log('Refreshing data...', { timeRange, customDate });
  }, [refreshCount, timeRange, customDate]);

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
              value="2,845"
              change={12.5}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricCard
              title="Active Sessions"
              value="1,243"
              change={8.1}
              icon={<Activity className="h-4 w-4" />}
            />
            <MetricCard
              title="Orders Today"
              value="342"
              change={-2.3}
              icon={<ShoppingCart className="h-4 w-4" />}
            />
            <MetricCard
              title="API Response Time"
              value="128ms"
              change={-5.2}
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
                <SystemStatus />
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
                  <span className="text-sm">99.98%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Server Version</span>
                  </div>
                  <span className="text-sm">v1.2.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Avg. Response</span>
                  </div>
                  <span className="text-sm">142ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Active Users (24h)</span>
                  </div>
                  <span className="text-sm">1,243</span>
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
                <RecentActivity />
              </CardContent>
            </Card>
          </div>

          {/* System Alerts */}
          <SystemAlerts />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <MetricsCharts timeRange={timeRange} customDate={customDate} />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResourceUsage />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <SystemStatus />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}