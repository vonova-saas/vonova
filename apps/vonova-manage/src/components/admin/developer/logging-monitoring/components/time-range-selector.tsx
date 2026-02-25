import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/utils/functions";
import { TimeRange } from "../types";

const timeRanges = [
  { value: '5m', label: 'Last 5m' },
  { value: '15m', label: 'Last 15m' },
  { value: '1h', label: 'Last 1h' },
  { value: '6h', label: 'Last 6h' },
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7d' },
  { value: 'custom', label: 'Custom' },
];

interface TimeRangeSelectorProps {
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  customDate?: Date;
  onCustomDateChange?: (date: Date | undefined) => void;
  className?: string;
}

export function TimeRangeSelector({
  range,
  onRangeChange,
  customDate,
  onCustomDateChange,
  className,
}: TimeRangeSelectorProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex items-center rounded-md border">
        {timeRanges.map((tr) => (
          <Button
            key={tr.value}
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 rounded-none text-xs font-normal",
              range === tr.value
                ? "bg-accent text-accent-foreground hover:bg-accent/90"
                : "hover:bg-muted/50"
            )}
            onClick={() => onRangeChange(tr.value as TimeRange)}
          >
            {tr.label}
          </Button>
        ))}
      </div>

      {range === 'custom' && onCustomDateChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 w-[200px] justify-start text-left text-xs font-normal",
                !customDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customDate ? (
                format(customDate, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={customDate}
              onSelect={onCustomDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}

      <div className="flex items-center text-sm text-muted-foreground">
        <Clock className="mr-1 h-4 w-4" />
        <span className="text-xs">
          {format(new Date(), 'MMM d, yyyy HH:mm')}
        </span>
      </div>
    </div>
  );
}
