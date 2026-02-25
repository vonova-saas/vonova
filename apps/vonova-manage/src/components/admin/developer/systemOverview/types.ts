export type TimeRange = '24h' | '7d' | '30d' | 'custom';

export interface TimeRangeSelectorProps {
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  customDate?: Date;
  onCustomDateChange?: (date: Date | undefined) => void;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export interface ActivityItemProps {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description: string;
  timestamp: Date;
}

export type AlertType = 'error' | 'warning' | 'info' | 'success';

export interface SystemAlert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface StatusItemProps {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  icon: React.ReactNode;
}

export interface MetricsChartsProps {
  timeRange: TimeRange;
  customDate?: Date;
}