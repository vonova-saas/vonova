"use client";

import { Home, MessageSquare, HelpCircle, CheckSquare, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChatTab = "home" | "messages" | "help" ;

const items: { key: ChatTab; label: string; Icon: LucideIcon }[] = [
  { key: "home", label: "Home", Icon: Home },
  { key: "messages", label: "Messages", Icon: MessageSquare },
  { key: "help", label: "Help", Icon: HelpCircle },
];

export default function BottomNav({ value, onChange }: { value: ChatTab; onChange: (v: ChatTab) => void }) {
  return (
    <div className="border-t p-2">
<nav className="grid grid-cols-3 gap-1 px-2">   
  {items.map(({ key, label, Icon }) => (
    <button
      key={key}
      onClick={() => onChange(key)}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg py-3 px-2",  
        "transition-colors duration-200",
        value === key 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <Icon className="h-6 w-6 mb-1" />   
      <span className="text-xs">{label}</span>
    </button>
  ))}
</nav>
    </div>
  );
}
