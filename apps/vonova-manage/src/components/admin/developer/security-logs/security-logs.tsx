'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, BarChart2, Clock, List, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAutoRefresh } from "@/hooks/admin/use-auto-refresh";
import { SecurityLogsTable } from './logs/security-logs-table';
import { SecurityMetrics } from './metrics/security-metrics';
import { SecurityAlerts } from './alerts/security-alerts';
import { TimeRangeSelector } from '../systemOverview/time-range-selector';
import type { TimeRange } from '../systemOverview/types';
import { formatDistanceToNow } from 'date-fns';

export default function SecurityLogs() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeTab, setActiveTab] = useState('logs');

  const {
    isAutoRefreshing,
    lastRefresh,
    refreshCount,
    triggerRefresh,
  } = useAutoRefresh(60);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Security Center</h2>
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
            Monitor and manage security events and logs
          </p>
          <TimeRangeSelector
            range={timeRange}
            onRangeChange={setTimeRange}
            customDate={customDate}
            onCustomDateChange={setCustomDate}
          />
        </div>
      </div>

      <Tabs
        defaultValue="logs"
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Security Logs
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <SecurityLogsTable
            refreshCount={refreshCount}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <SecurityAlerts />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <SecurityMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
