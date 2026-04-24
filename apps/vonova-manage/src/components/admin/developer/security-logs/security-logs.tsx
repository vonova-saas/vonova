'use client';

import { useState } from 'react';
import { useEffect } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { getSecurityLogsQueryFn } from '@/services/admin/admin.api';

export default function SecurityLogs() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState('logs');
  const [search, setSearch] = useState('');

  const {
    isAutoRefreshing,
    lastRefresh,
    refreshCount,
    triggerRefresh,
  } = useAutoRefresh(60);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['admin-security-logs', timeRange, customDate?.toISOString(), search],
    queryFn: () =>
      getSecurityLogsQueryFn({
        range: timeRange,
        customDate: timeRange === 'custom' ? customDate?.toISOString() : undefined,
        search: search || undefined,
        limit: 200,
      }),
  });

  useEffect(() => {
    void refetch();
  }, [refreshCount, refetch]);

  const securityData = data?.data;

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
        value={activeTab}
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="logs" className="flex items-center gap-2">
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
            logs={securityData?.logs ?? []}
            searchTerm={search}
            onSearchTermChange={setSearch}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <SecurityAlerts alerts={securityData?.alerts ?? []} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <SecurityMetrics
            metrics={securityData?.metrics}
            summary={securityData?.summary}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
