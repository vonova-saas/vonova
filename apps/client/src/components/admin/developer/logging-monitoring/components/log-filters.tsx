import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogFilter, LogSource } from "../types";
import { cn } from "@/utils/functions";
import { X } from "lucide-react";

const logLevels = [
  { id: 'error', label: 'Error', color: 'bg-red-500' },
  { id: 'warning', label: 'Warning', color: 'bg-amber-500' },
  { id: 'info', label: 'Info', color: 'bg-blue-500' },
  { id: 'debug', label: 'Debug', color: 'bg-gray-500' },
  { id: 'trace', label: 'Trace', color: 'bg-gray-400' },
];

interface LogFiltersProps {
  onFilterChange: (filters: Partial<LogFilter>) => void;
  selectedSource?: LogSource | null;
  onSourceSelect: (source: LogSource | null) => void;
  sources: LogSource[];
  currentFilters?: Partial<LogFilter>;
  className?: string;
}

export function LogFilters({
  onFilterChange,
  selectedSource,
  onSourceSelect,
  sources,
  currentFilters = {},
  className,
}: LogFiltersProps) {
  const activeFilters = {
    level: currentFilters.level || [],
    source: currentFilters.source || [],
  };

  const toggleLevelFilter = (level: string) => {
    const newLevels = activeFilters.level.includes(level as never)
      ? activeFilters.level.filter(l => l !== level)
      : [...activeFilters.level, level as never];
    
    onFilterChange({ level: newLevels });
  };

  const toggleSourceFilter = (sourceId: string) => {
    const newSources = activeFilters.source.includes(sourceId)
      ? activeFilters.source.filter(s => s !== sourceId)
      : [...activeFilters.source, sourceId];
    
    onFilterChange({ source: newSources });
  };

  const clearAllFilters = () => {
    onFilterChange({ level: [], source: [] });
    onSourceSelect(null);
  };

  const hasActiveFilters = 
    activeFilters.level.length > 0 || 
    activeFilters.source.length > 0 ||
    selectedSource;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-medium text-muted-foreground mr-2">Filter by:</h4>
        
        {/* Log Level Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {logLevels.map(level => (
            <Button
              key={level.id}
              variant="outline"
              size="sm"
              className={cn(
                'h-8 px-2.5 text-xs font-mono',
                activeFilters.level.includes(level.id as never) 
                  ? 'bg-accent text-accent-foreground' 
                  : 'bg-background',
                'flex items-center gap-1.5'
              )}
              onClick={() => toggleLevelFilter(level.id)}
            >
              <span className={`h-2 w-2 rounded-full ${level.color}`} />
              {level.label}
              {activeFilters.level.includes(level.id as never) && (
                <X className="h-3 w-3 ml-1" />
              )}
            </Button>
          ))}
        </div>

        {/* Source Filter Dropdown */}
        {sources.length > 0 && (
          <div className="relative">
            <select
              value={selectedSource?.id || ''}
              onChange={(e) => {
                const source = sources.find(s => s.id === e.target.value) || null;
                onSourceSelect(source);
              }}
              className="h-8 rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">All Sources</option>
              {sources.map(source => (
                <option key={source.id} value={source.id}>
                  {source.name} ({source.logCount})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Active Filters Badges */}
        {hasActiveFilters && (
          <div className="flex items-center ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={clearAllFilters}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Selected Filters */}
      {(activeFilters.level.length > 0 || activeFilters.source.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          
          {activeFilters.level.map(level => {
            const levelInfo = logLevels.find(l => l.id === level);
            if (!levelInfo) return null;
            
            return (
              <Badge 
                key={level} 
                variant="secondary" 
                className="text-xs font-normal"
              >
                <span className={`h-2 w-2 rounded-full ${levelInfo.color} mr-1`} />
                {levelInfo.label}
                <button 
                  onClick={() => toggleLevelFilter(level)}
                  className="ml-1.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          
          {activeFilters.source.map(sourceId => {
            const source = sources.find(s => s.id === sourceId);
            if (!source) return null;
            
            return (
              <Badge 
                key={sourceId} 
                variant="secondary" 
                className="text-xs font-normal"
              >
                Source: {source.name}
                <button 
                  onClick={() => toggleSourceFilter(sourceId)}
                  className="ml-1.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
