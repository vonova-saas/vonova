"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServerMetrics } from "./metrics/server-metrics";
import { DatabaseMetrics } from "./metrics/database-metrics";
import { ApiMetrics } from "./metrics/api-metrics";
import { ResponseTimeChart } from "./overview/response-time-chart";
import { SystemResources } from "./overview/system-resources";
import { Button } from "@/components/ui/button";
import { Database, LayoutDashboard, RefreshCw, Route, Server } from "lucide-react";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { useAutoRefresh } from "@/hooks/admin/use-auto-refresh";
import { TimeRangeSelector } from "../systemOverview/time-range-selector";
import type { TimeRange } from '../systemOverview/types';
import { useState } from 'react';

export default function PerformanceMetrics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date());

  const {
    isAutoRefreshing,
    lastRefresh,
    triggerRefresh,
  } = useAutoRefresh(60);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Performance Metrics</h2>
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
            Monitor and analyze system performance in real-time
          </p>
          <TimeRangeSelector
            range={timeRange}
            onRangeChange={setTimeRange}
            customDate={customDate}
            onCustomDateChange={setCustomDate}
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="server" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Server
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            API
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <ResponseTimeChart />
          <SystemResources />
        </TabsContent>
        <TabsContent value="server">
          <ServerMetrics />
        </TabsContent>
        <TabsContent value="database">
          <DatabaseMetrics />
        </TabsContent>
        <TabsContent value="api">
          <ApiMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
