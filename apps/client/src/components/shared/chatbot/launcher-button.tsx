"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
type Props = React.ComponentProps<typeof Button> & {
  sizePx?: number; // button size in px (height = width)
};

const ChatbotLauncher = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, sizePx = 40, ...props }, ref) => {   
    return (
      <button
        ref={ref}
        {...props}
        className={cn(
          "fixed bottom-6 right-6 z-[60]",           
          "flex items-center justify-center",
          "text-primary hover:text-primary/80",
          "transition-all duration-300 hover:scale-110 active:scale-95",
          "drop-shadow-xl hover:drop-shadow-2xl", 
          className
        )}
        aria-label="Open AI Assistant"
      >
        <Bot 
          className="stroke-[1.8]" 
          style={{ width: sizePx, height: sizePx }} 
        />
      </button>
    );
  }
);

ChatbotLauncher.displayName = "ChatbotLauncher";

export default ChatbotLauncher;
