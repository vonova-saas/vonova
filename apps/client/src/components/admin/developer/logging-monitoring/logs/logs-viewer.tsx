'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { LogEntry, LogFilter } from "../types";
import { cn } from "@/utils/functions";
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";

interface LogsViewerProps {
  logs: LogEntry[];
  isLoading?: boolean;
  onFilterChange: (filter: Partial<LogFilter>) => void;
  currentFilter: LogFilter;
  onLogSelected: (log: LogEntry) => void;
  selectedLogId?: string;
}

export const LogLevelBadge = ({ level, className }: { level: LogEntry['level'], className?: string }) => {
  const levelConfig = {
    error: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-200',
      label: 'ERROR'
    },
    warning: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-800 dark:text-amber-200',
      label: 'WARN'
    },
    info: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-200',
      label: 'INFO'
    },
    debug: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-200',
      label: 'DEBUG'
    },
    trace: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-200',
      label: 'TRACE'
    },
  };

  const config = levelConfig[level] || levelConfig.info;

  return (
    <Badge 
      className={cn(
        'text-xs font-mono font-medium px-2 py-0.5',
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </Badge>
  );
};

export function LogsViewer({
  logs,
  isLoading = false,
  onFilterChange,
  currentFilter,
  onLogSelected,
  selectedLogId
}: LogsViewerProps) {
  // const handleLevelClick = (level: LogEntry['level']) => {
  //   onFilterChange({
  //     level: currentFilter.level.includes(level)
  //       ? currentFilter.level.filter(l => l !== level)
  //       : [...currentFilter.level, level]
  //   });
  // };

  const handleSourceClick = (source: string) => {
    onFilterChange({
      source: currentFilter.source?.includes(source)
        ? currentFilter.source.filter(s => s !== source)
        : [...(currentFilter.source || []), source]
    });
  };

  if (isLoading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading logs...
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center space-y-2 text-muted-foreground">
        <div className="text-lg font-medium">No logs found</div>
        <p className="text-sm">Try adjusting your filters or time range</p>
      </div>
    );
  }

  return (
    <Card className="h-[600px] overflow-hidden">
      <ScrollArea className="h-full">
        <div className="divide-y divide-border">
          {logs.map((log) => (
            <div 
              key={log.id}
              className={cn(
                'p-4 hover:bg-muted/50 cursor-pointer transition-colors',
                selectedLogId === log.id && 'bg-muted/30',
                log.level === 'error' && 'bg-red-50/50 dark:bg-red-900/10',
                log.level === 'warning' && 'bg-amber-50/50 dark:bg-amber-900/10',
              )}
              onClick={() => onLogSelected(log)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-24 flex-shrink-0">
                    <LogLevelBadge level={log.level} />
                  </div>
                  <div className="text-sm font-mono text-muted-foreground">
                    {format(log.timestamp, 'HH:mm:ss.SSS')}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{log.message}</div>
                  {log.source && (
                    <div className="mt-1">
                      <Badge 
                        variant="outline" 
                        className="text-xs font-mono cursor-pointer hover:bg-muted-foreground/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSourceClick(log.source);
                        }}
                      >
                        {log.source}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
