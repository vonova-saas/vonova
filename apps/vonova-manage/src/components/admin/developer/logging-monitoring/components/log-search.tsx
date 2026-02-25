import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/utils/functions";

interface LogSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function LogSearch({ 
  value, 
  onChange, 
  placeholder = "Search logs...",
  className,
  disabled = false
}: LogSearchProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="w-full pl-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
