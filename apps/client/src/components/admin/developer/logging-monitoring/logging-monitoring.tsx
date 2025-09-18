'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Clock, AlertCircle, Search, Filter, BarChart2, List, X, Plus, BellOff, MoreHorizontal, Badge } from "lucide-react";
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

export function LoggingMonitoring() {
  const [activeTab, setActiveTab] = useState('logs');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [selectedSource, setSelectedSource] = useState<LogSource | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [logLevels, setLogLevels] = useState<LogEntry['level'][]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const {
    isAutoRefreshing,
    lastRefresh,
    refreshCount,
    triggerRefresh,
  } = useAutoRefresh(30);

  // Simulate data refresh when refreshCount changes
  useEffect(() => {
    // In a real app, you would fetch new data here
    console.log('Refreshing data...', {
      timeRange,
      customDate,
      searchQuery,
      selectedSource: selectedSource?.id
    });
  }, [refreshCount, timeRange, customDate, searchQuery, selectedSource]);

  // Mock data
  const mockSources: LogSource[] = [
    { id: 'api', name: 'API Server', type: 'application', logCount: 1245, lastUpdated: new Date() },
    { id: 'database', name: 'Database', type: 'database', logCount: 843, lastUpdated: new Date() },
    { id: 'auth', name: 'Auth Service', type: 'service', logCount: 321, lastUpdated: new Date() },
    { id: 'frontend', name: 'Frontend', type: 'application', logCount: 567, lastUpdated: new Date() },
    { id: 'worker', name: 'Worker', type: 'service', logCount: 289, lastUpdated: new Date() },
  ];

  const generateMockLogs = (count: number): LogEntry[] => {
    const levels: LogEntry['level'][] = ['error', 'warning', 'info', 'debug', 'trace'];
    const sources = ['api', 'database', 'auth', 'frontend', 'worker'];
    const messages = [
      'User authentication failed',
      'Database connection established',
      'Request processed successfully',
      'Cache miss for key',
      'Performance metrics collected',
      'New user registered',
      'Payment processed',
      'Email sent successfully',
      'File uploaded',
      'Background job completed'
    ];

    return Array.from({ length: count }, (_, i) => {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const message = `${messages[Math.floor(Math.random() * messages.length)]} #${Math.floor(Math.random() * 1000)}`;

      return {
        id: `log-${i}`,
        timestamp,
        level,
        message,
        source,
        context: Math.random() > 0.7 ? {
          userId: `user-${Math.floor(Math.random() * 1000)}`,
          requestId: `req-${Math.random().toString(36).substring(2, 10)}`,
          duration: `${Math.floor(Math.random() * 500)}ms`,
          ...(Math.random() > 0.5 && { ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` })
        } : undefined,
        stackTrace: level === 'error' && Math.random() > 0.5 ?
          `Error: Something went wrong\n    at Function.<anonymous> (/app/src/services/${source}.js:${Math.floor(Math.random() * 200) + 1}:${Math.floor(Math.random() * 50) + 1})\n    at processTicksAndRejections (node:internal/process/task_queues:96:5)`
          : undefined
      };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const mockLogs = generateMockLogs(50);

  const handleLogSelect = (log: LogEntry) => {
    setSelectedLog(log);
  };

  const handleFilterChange = (filters: { level?: LogEntry['level'][]; source?: string[] }) => {
    if (filters.level !== undefined) {
      setLogLevels(filters.level);
    }
    if (filters.source !== undefined) {
      setSelectedSources(filters.source);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Logging & Monitoring</h2>
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
            Monitor and analyze system logs and metrics
          </p>
          <TimeRangeSelector
            range={timeRange}
            onRangeChange={setTimeRange}
            customDate={customDate}
            onCustomDateChange={setCustomDate}
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,245</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <div className="h-4 w-4 rounded-full bg-red-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">+5% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142ms</div>
            <p className="text-xs text-muted-foreground">-8% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <div className="h-4 w-4 rounded-full bg-purple-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,243</div>
            <p className="text-xs text-muted-foreground">+8.1% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <LogSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search logs by message, source, or context..."
            />
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 sm:flex-initial"
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setLogLevels([]);
                setSelectedSources([]);
                setSelectedSource(null);
              }}
              className="flex-1 sm:flex-initial"
            >
              Clear All
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="pt-4">
              <LogFilters
                onFilterChange={handleFilterChange}
                selectedSource={selectedSource}
                onSourceSelect={(sourceId) => {
                  const source = mockSources.find(() => sourceId) || null;
                  setSelectedSource(source);
                }}
                sources={mockSources}
                currentFilters={{
                  level: logLevels,
                  source: selectedSource ? [selectedSource.id] : []
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="logs" className="flex items-center space-x-2">
            <List className="h-4 w-4" />
            <span>Logs</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center space-x-2">
            <BarChart2 className="h-4 w-4" />
            <span>Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>Alerts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-12">
            <div className={`${selectedLog ? 'md:col-span-8' : 'md:col-span-12'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Recent Logs</h3>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  <span>Live</span>
                  <span className="mx-2">•</span>
                  <span>{mockLogs.length} entries found</span>
                </div>
              </div>
              <LogsViewer
                logs={mockLogs.filter(log => {
                  // Apply filters
                  if (logLevels.length > 0 && !logLevels.includes(log.level)) {
                    return false;
                  }
                  if (selectedSource && log.source !== selectedSource.id) {
                    return false;
                  }
                  if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
                    return false;
                  }
                  return true;
                })}
                onLogSelected={handleLogSelect}
                selectedLogId={selectedLog?.id}
                currentFilter={{
                  level: logLevels,
                  timeRange,
                  searchQuery,
                  source: selectedSource ? [selectedSource.id] : []
                }}
                onFilterChange={handleFilterChange}
              />
            </div>
            {selectedLog ? (
              <div className="md:col-span-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Log Details</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(null)}
                    className="h-8 px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <LogDetails
                  log={selectedLog}
                  onClose={() => setSelectedLog(null)}
                />
              </div>
            ) : (
              <div className="md:col-span-4 flex items-center justify-center border-2 border-dashed rounded-lg p-8">
                <div className="text-center space-y-2">
                  <Search className="h-8 w-8 mx-auto text-muted-foreground" />
                  <h3 className="text-sm font-medium">No log selected</h3>
                  <p className="text-xs text-muted-foreground">
                    Click on a log entry to view its details
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <MetricsDashboard
            timeRange={timeRange}
            customDate={customDate}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Alerts</CardTitle>
                <Button variant="outline" size="sm" className="h-8">
                  <Plus className="mr-2 h-4 w-4" />
                  New Alert Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>High Error Rate Detected</AlertTitle>
                  <AlertDescription>
                    Error rate has exceeded 5% in the last 15 minutes
                  </AlertDescription>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Triggered 5 minutes ago • <Button variant="link" className="h-auto p-0 text-xs">View details</Button>
                  </div>
                </Alert>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>API Response Time Degraded</AlertTitle>
                  <AlertDescription>
                    Average response time is above 500ms for the last 30 minutes
                  </AlertDescription>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Triggered 42 minutes ago • <Button variant="link" className="h-auto p-0 text-xs">View details</Button>
                  </div>
                </Alert>

                <div className="text-center py-8">
                  <BellOff className="h-8 w-8 mx-auto text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No more alerts</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    All clear! No active alerts to display.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Triggered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Error Rate Alert</TableCell>
                    <TableCell>Error rate &gt; 5% for 15m</TableCell>
                    <TableCell><Badge>Active</Badge></TableCell>
                    <TableCell>5 minutes ago</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Response Time Alert</TableCell>
                    <TableCell>Avg. response &gt; 500ms for 30m</TableCell>
                    <TableCell><Badge>Active</Badge></TableCell>
                    <TableCell>42 minutes ago</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
