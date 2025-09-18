import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/utils/functions";
import { TimeRangeSelectorProps } from "./types";

export function TimeRangeSelector({
  range,
  onRangeChange,
  customDate,
  onCustomDateChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1 rounded-md border bg-background p-1">
        {(['24h', '7d', '30d'] as const).map((timeRange) => (
          <Button
            key={timeRange}
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 px-2 text-xs',
              range === timeRange
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground'
            )}
            onClick={() => onRangeChange(timeRange)}
          >
            {timeRange}
          </Button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-2 text-xs',
                range === 'custom'
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
              onClick={() => onRangeChange('custom')}
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              {customDate ? format(customDate, 'MMM d, yyyy') : 'Custom'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={customDate}
              onSelect={(date) => {
                if (date) {
                  onCustomDateChange?.(date);
                  onRangeChange('custom');
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <Clock className="mr-1 h-4 w-4" />
        {range === 'custom' && customDate
          ? `Showing data for ${format(customDate, 'MMM d, yyyy')}`
          : `Last ${range}`}
      </div>
    </div>
  );
}
