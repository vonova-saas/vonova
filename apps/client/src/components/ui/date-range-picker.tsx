"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/utils/functions"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangePicker({
  className,
  initialDateFrom,
  initialDateTo,
  onUpdate,
  align = "start",
  showCompare = true,
}: {
  className?: string
  initialDateFrom: Date | undefined
  initialDateTo: Date | null
  onUpdate: (values: { range: DateRange }) => void
  align?: "start" | "center" | "end"
  showCompare?: boolean
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: initialDateFrom,
    to: initialDateTo || undefined,
  })

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !range && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {range?.from ? (
              range.to ? (
                <>
                  {format(range.from, "LLL dd, y")} -{" "}
                  {format(range.to, "LLL dd, y")}
                </>
              ) : (
                format(range.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={range?.from}
            selected={range}
            onSelect={(newRange) => {
              setRange(newRange)
              if (newRange?.from && newRange?.to) {
                onUpdate({ range: newRange })
                setIsOpen(false)
              }
            }}
            numberOfMonths={2}
          />
          {showCompare && (
            <div className="flex items-center justify-end gap-2 p-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  const today = new Date()
                  const newRange = {
                    from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7),
                    to: today,
                  }
                  setRange(newRange)
                  onUpdate({ range: newRange })
                  setIsOpen(false)
                }}
              >
                Last 7 days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  const today = new Date()
                  const newRange = {
                    from: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()),
                    to: today,
                  }
                  setRange(newRange)
                  onUpdate({ range: newRange })
                  setIsOpen(false)
                }}
              >
                Last 30 days
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
