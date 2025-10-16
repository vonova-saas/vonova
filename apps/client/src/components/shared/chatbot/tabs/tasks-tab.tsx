"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TaskItem } from "../mock-data";

export default function TasksTab({ tasks }: { tasks: TaskItem[] }) {
  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-2">
        {tasks.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-md border px-3 py-2 flex items-start justify-between",
              t.completed && "opacity-70"
            )}
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{t.title}</p>
              {t.description && (
                <p className="text-sm text-muted-foreground truncate">{t.description}</p>
              )}
            </div>
            <div className="text-xs">{t.completed ? "Done" : "Pending"}</div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
