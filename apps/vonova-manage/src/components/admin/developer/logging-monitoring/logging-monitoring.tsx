'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Clock, AlertCircle, Search, Filter, BarChart2, List, X, Plus, BellOff, MoreHorizontal } from "lucide-react";
import { TimeRangeSelector } from "./components/time-range-selector";
import { LogsViewer } from "./logs/logs-viewer";
import { MetricsDashboard } from "./metrics/metrics-dashboard";
import { LogDetails } from "./logs/log-details";
import { LogSearch } from "./components/log-search";
import { LogFilters } from "./components/log-filters";
import { LogSource, LogEntry, TimeRange } from "./types";
import { useAutoRefresh } from "@/hooks/admin/use-auto-refresh";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getLoggingMonitoringQueryFn } from '@/services/admin/admin.api';

export function LoggingMonitoring() {
  const [activeTab, setActiveTab] = useState('logs');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [selectedSource, setSelectedSource] = useState<LogSource | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [logLevels, setLogLevels] = useState<LogEntry['level'][]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const { isAutoRefreshing, lastRefresh, refreshCount, triggerRefresh } = useAutoRefresh(30);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'admin-logging-monitoring',
      timeRange,
      customDate?.toISOString(),
      searchQuery,
      logLevels.join(','),
      selectedSource?.id,
    ],
    queryFn: () =>
      getLoggingMonitoringQueryFn({
        range: timeRange,
        customDate: timeRange === 'custom' ? customDate?.toISOString() : undefined,
        search: searchQuery || undefined,
        levels: logLevels.length ? logLevels : undefined,
        sources: selectedSource ? [selectedSource.id] : undefined,
        limit: 100,
      }),
  });

  useEffect(() => {
    void refetch();
  }, [refreshCount, refetch]);

  const monitoring = data?.data as any;
  const logs: LogEntry[] = monitoring?.logs?.map((log: any) => ({ ...log, timestamp: new Date(log.timestamp) })) ?? [];
  const sources: LogSource[] =
    monitoring?.sources?.map((s: any) => ({ ...s, lastUpdated: new Date(s.lastUpdated) })) ?? [];

  // Check if admin logs are disabled
  if (monitoring?.message === 'Admin logs are disabled') {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Logging & Monitoring</h2>
          </div>
          <p className="text-sm text-muted-foreground">Admin logs have been disabled by the system administrator.</p>
        </div>
        
        <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
          <div className="text-center space-y-2">
            <BellOff className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">Logging Disabled</h3>
            <p className="text-sm text-muted-foreground">Admin logs are currently disabled for privacy or performance reasons.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleFilterChange = (filters: { level?: LogEntry['level'][]; source?: string[] }) => {
    if (filters.level !== undefined) setLogLevels(filters.level);
    if (filters.source !== undefined) setSelectedSources(filters.source);
  };

  const filteredLogs = logs.filter((log) => {
    if (logLevels.length > 0 && !logLevels.includes(log.level)) return false;
    if (selectedSource && log.source !== selectedSource.id) return false;
    if (selectedSources.length > 0 && !selectedSources.includes(log.source)) return false;
    if (searchQuery && !(`${log.message} ${log.source}`.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Logging & Monitoring</h2>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => triggerRefresh()}>
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
          <p className="text-sm text-muted-foreground">Monitor and analyze system logs and metrics</p>
          <TimeRangeSelector range={timeRange} onRangeChange={setTimeRange} customDate={customDate} onCustomDateChange={setCustomDate} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Logs</CardTitle><div className="h-4 w-4 rounded-full bg-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{monitoring?.summary.totalLogs.toLocaleString() ?? (isLoading ? '...' : '0')}</div><p className="text-xs text-muted-foreground">Selected time window</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Errors</CardTitle><div className="h-4 w-4 rounded-full bg-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{monitoring?.summary.errors.toLocaleString() ?? (isLoading ? '...' : '0')}</div><p className="text-xs text-muted-foreground">{monitoring?.summary.totalLogs ? `${((monitoring.summary.errors / monitoring.summary.totalLogs) * 100).toFixed(2)}% of logs` : 'No logs yet'}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle><div className="h-4 w-4 rounded-full bg-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{monitoring?.summary.avgResponseMs != null ? `${monitoring.summary.avgResponseMs}ms` : (isLoading ? '...' : 'N/A')}</div><p className="text-xs text-muted-foreground">Average from request logs</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Users</CardTitle><div className="h-4 w-4 rounded-full bg-purple-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{monitoring?.summary.activeUsers.toLocaleString() ?? (isLoading ? '...' : '0')}</div><p className="text-xs text-muted-foreground">Active users in last 24h</p></CardContent></Card>
      </div>

      <div className="flex flex-col space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1"><LogSearch value={searchQuery} onChange={setSearchQuery} placeholder="Search logs by message, source, or context..." /></div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="flex-1 sm:flex-initial"><Filter className="mr-2 h-4 w-4" />{showFilters ? 'Hide Filters' : 'Show Filters'}</Button>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setLogLevels([]); setSelectedSources([]); setSelectedSource(null); }} className="flex-1 sm:flex-initial">Clear All</Button>
          </div>
        </div>
        {showFilters && (
          <Card>
            <CardContent className="pt-4">
              <LogFilters
                onFilterChange={handleFilterChange}
                selectedSource={selectedSource}
                onSourceSelect={(source) => setSelectedSource(source)}
                sources={sources}
                currentFilters={{ level: logLevels, source: selectedSource ? [selectedSource.id] : selectedSources }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs" className="flex items-center space-x-2"><List className="h-4 w-4" /><span>Logs</span></TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center space-x-2"><BarChart2 className="h-4 w-4" /><span>Metrics</span></TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center space-x-2"><AlertCircle className="h-4 w-4" /><span>Alerts</span></TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-12">
            <div className={`${selectedLog ? 'md:col-span-8' : 'md:col-span-12'}`}>
              <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-medium">Recent Logs</h3><div className="flex items-center text-xs text-muted-foreground"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" /><span>Live</span><span className="mx-2">•</span><span>{filteredLogs.length} entries found</span></div></div>
              <LogsViewer
                logs={filteredLogs}
                onLogSelected={setSelectedLog}
                selectedLogId={selectedLog?.id}
                currentFilter={{ level: logLevels, timeRange, searchQuery, source: selectedSource ? [selectedSource.id] : selectedSources }}
                onFilterChange={handleFilterChange}
              />
            </div>
            {selectedLog ? (
              <div className="md:col-span-4">
                <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-medium">Log Details</h3><Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)} className="h-8 px-2"><X className="h-4 w-4" /></Button></div>
                <LogDetails log={selectedLog} onClose={() => setSelectedLog(null)} />
              </div>
            ) : (
              <div className="md:col-span-4 flex items-center justify-center border-2 border-dashed rounded-lg p-8">
                <div className="text-center space-y-2"><Search className="h-8 w-8 mx-auto text-muted-foreground" /><h3 className="text-sm font-medium">No log selected</h3><p className="text-xs text-muted-foreground">Click on a log entry to view its details</p></div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <MetricsDashboard
            timeRange={timeRange}
            customDate={customDate}
            data={monitoring?.metrics ?? { responseTime: [], errorRate: [], requestVolume: [], requestDistribution: [{ id: '2xx', label: '2xx', value: 0 }, { id: '3xx', label: '3xx', value: 0 }, { id: '4xx', label: '4xx', value: 0 }, { id: '5xx', label: '5xx', value: 0 }] }}
            summary={monitoring?.summary ?? { totalLogs: 0, errors: 0, avgResponseMs: null, activeUsers: 0, totalUsers: 0 }}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader><div className="flex items-center justify-between"><CardTitle>Alerts</CardTitle><Button variant="outline" size="sm" className="h-8"><Plus className="mr-2 h-4 w-4" />New Alert Rule</Button></div></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(monitoring?.alerts.length ?? 0) > 0 ? monitoring?.alerts.map((alert: any) => (
                  <Alert key={alert.id}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>{alert.description}</AlertDescription>
                    <div className="mt-2 text-xs text-muted-foreground">Triggered {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}</div>
                  </Alert>
                )) : (
                  <div className="text-center py-8"><BellOff className="h-8 w-8 mx-auto text-muted-foreground" /><h3 className="mt-2 text-sm font-medium">No active alerts</h3><p className="text-xs text-muted-foreground mt-1">All clear for the selected range.</p></div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Alert Rules</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Condition</TableHead><TableHead>Status</TableHead><TableHead>Last Triggered</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-medium">Error Rate Alert</TableCell><TableCell>Error rate &gt;= 5%</TableCell><TableCell><Badge variant="secondary">Active</Badge></TableCell><TableCell>{monitoring?.alerts[0]?.triggeredAt ? formatDistanceToNow(new Date(monitoring.alerts[0].triggeredAt), { addSuffix: true }) : 'N/A'}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Response Time Alert</TableCell><TableCell>Avg. response &gt;= 500ms</TableCell><TableCell><Badge variant="secondary">Active</Badge></TableCell><TableCell>{monitoring?.alerts[1]?.triggeredAt ? formatDistanceToNow(new Date(monitoring.alerts[1].triggeredAt), { addSuffix: true }) : 'N/A'}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
