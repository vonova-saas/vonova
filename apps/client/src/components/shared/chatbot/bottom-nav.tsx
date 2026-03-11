"use client";


import { Home, MessageSquare, HelpCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChatTab = "home" | "messages" | "help";

const items: { key: ChatTab; label: string; Icon: LucideIcon }[] = [
  { key: "home",     label: "Home",     Icon: Home          },
  { key: "messages", label: "Messages", Icon: MessageSquare },
  { key: "help",     label: "Help",     Icon: HelpCircle    },
];

export default function BottomNav({
  value,
  onChange,
}: {
  value: ChatTab;
  onChange: (v: ChatTab) => void;
}) {
  return (
    <div className="border-t bg-background shrink-0">
      <nav className="grid grid-cols-3 divide-x divide-border">
        {items.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "flex flex-col items-center py-3 text-xs transition-colors",
              value === key
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="h-5 w-5 mb-1" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}