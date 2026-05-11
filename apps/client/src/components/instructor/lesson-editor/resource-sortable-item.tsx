"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ResourceSortableItemProps = {
  id: string;
  index?: number;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
};

export function ResourceSortableItem({
  id,
  index,
  disabled,
  children,
  className,
}: ResourceSortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-stretch gap-3 rounded-xl border bg-card p-3 shadow-xs transition-all duration-200",
        "hover:-translate-y-px hover:border-primary/40 hover:shadow-md",
        isDragging &&
          "z-10 scale-[1.01] border-primary/60 bg-card/95 shadow-xl ring-2 ring-primary/30 backdrop-blur",
        disabled && "opacity-60",
        className,
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-7 cursor-grab touch-none select-none items-center justify-center rounded-md text-muted-foreground transition-all",
              "hover:bg-accent hover:text-foreground",
              "active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
            disabled={disabled}
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 shrink-0" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">Drag to reorder</TooltipContent>
      </Tooltip>

      {typeof index === "number" ? (
        <div
          className="hidden h-7 w-7 shrink-0 items-center justify-center self-center rounded-md border bg-muted/40 text-[11px] font-semibold tabular-nums text-muted-foreground sm:flex"
          aria-hidden
        >
          {index + 1}
        </div>
      ) : null}

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
