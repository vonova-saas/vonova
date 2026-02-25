import { ReactNode } from 'react';

export type TimeRange = '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | 'custom';

export interface TimeRangeSelectorProps {
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  customDate?: Date;
  onCustomDateChange?: (date: Date | undefined) => void;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info' | 'debug' | 'trace';
  message: string;
  source: string;
  context?: Record<string, unknown>;
  stackTrace?: string;
}

export interface LogFilter {
  level: ('error' | 'warning' | 'info' | 'debug' | 'trace')[];
  source?: string[];
  searchQuery?: string;
  timeRange: TimeRange;
  customStartDate?: Date;
  customEndDate?: Date;
}

export interface LogsViewerProps {
  logs: LogEntry[];
  isLoading?: boolean;
  onFilterChange: (filter: Partial<LogFilter>) => void;
  currentFilter: LogFilter;
  onLogSelected: (log: LogEntry) => void;
  selectedLogId?: string;
}

export interface LogDetailsProps {
  log?: LogEntry;
  onClose: () => void;
}

export interface LogSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface LogLevelBadgeProps {
  level: LogEntry['level'];
  className?: string;
}

export interface MetricsData {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  chartData: MetricsData[];
  isLoading?: boolean;
  className?: string;
}

export interface LogSource {
  id: string;
  name: string;
  type: 'application' | 'database' | 'server' | 'service' | 'other';
  logCount: number;
  lastUpdated: Date;
}

export interface LogSourcesListProps {
  sources: LogSource[];
  selectedSourceId?: string;
  onSourceSelect: (sourceId: string) => void;
  isLoading?: boolean;
}

export interface LogLevelStats {
  error: number;
  warning: number;
  info: number;
  debug: number;
  trace: number;
}

export interface LogStats {
  total: number;
  levels: LogLevelStats;
  sources: { [key: string]: number };
  period: {
    start: Date;
    end: Date;
  };
}
