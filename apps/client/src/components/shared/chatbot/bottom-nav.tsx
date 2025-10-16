"use client";

import { Home, MessageSquare, HelpCircle, CheckSquare, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChatTab = "home" | "messages" | "help" | "tasks";

const items: { key: ChatTab; label: string; Icon: LucideIcon }[] = [
  { key: "home", label: "Home", Icon: Home },
  { key: "messages", label: "Messages", Icon: MessageSquare },
  { key: "help", label: "Help", Icon: HelpCircle },
  { key: "tasks", label: "Tasks", Icon: CheckSquare },
];

export default function BottomNav({ value, onChange }: { value: ChatTab; onChange: (v: ChatTab) => void }) {
  return (
    <div className="border-t p-2">
      <nav className="grid grid-cols-4 gap-2">
        {items.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "flex flex-col items-center justify-center rounded-md py-2 text-xs",
              value === key ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className={cn(value === key && "font-medium")}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
