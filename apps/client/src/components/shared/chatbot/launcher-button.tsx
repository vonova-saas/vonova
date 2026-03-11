"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = React.ComponentProps<typeof Button> & {
  sizePx?: number;
};

const ChatbotLauncher = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, sizePx = 40, ...props }, ref) => {
    const [showBubble, setShowBubble] = React.useState(true);

    // Auto-hide the welcome bubble after 5 seconds
    React.useEffect(() => {
      const timer = setTimeout(() => setShowBubble(false), 5000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="relative">
        {/* Welcome tooltip bubble */}
        {showBubble && (
          <div
            className="
              absolute bottom-full right-0 mb-3
              w-52 rounded-xl
              bg-white dark:bg-zinc-800
              shadow-lg border
              px-3 py-2
              text-sm text-foreground
              animate-in fade-in slide-in-from-bottom-2
              pointer-events-none
            "
          >
            👋 Hi there! How can I help you?
            {/* Small arrow pointing down */}
            <div className="absolute -bottom-[7px] right-5 w-3 h-3 bg-white dark:bg-zinc-800 border-r border-b rotate-45" />
          </div>
        )}

        <button
          ref={ref}
          {...props}
          onClick={(e) => {
            // Dismiss bubble immediately on click
            setShowBubble(false);
            props.onClick?.(e as React.MouseEvent<HTMLButtonElement>);
          }}
          className={cn(
            "flex items-center justify-center",
            "text-primary hover:text-primary/80",
            "transition-all duration-300 hover:scale-110 active:scale-95",
            "drop-shadow-xl hover:drop-shadow-2xl",
            className
          )}
          aria-label="Open AI Assistant"
        >
          <Bot className="stroke-[1.8]" style={{ width: sizePx, height: sizePx }} />
        </button>
      </div>
    );
  }
);

ChatbotLauncher.displayName = "ChatbotLauncher";
export default ChatbotLauncher;