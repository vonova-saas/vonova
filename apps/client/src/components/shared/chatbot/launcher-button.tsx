"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Button> & {
  sizePx?: number; // button size in px (height = width)
};

const ChatbotLauncher = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, sizePx = 70, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        {...props}
        className={cn(
          "p-0 bg-transparent hover:bg-transparent shadow-none border-0",
          "active:scale-95 transition-transform",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-full",
          className,
        )}
        style={{ width: sizePx, height: sizePx }}
      >
        <Image
          src="/images/chatbot/ai_chatbot.svg"
          alt="AI Chatbot"
          width={Math.round(sizePx * 0.65)}
          height={Math.round(sizePx * 0.65)}
          priority={false}
          className="transition-transform duration-200 hover:scale-105 drop-shadow-md"
        />
      </Button>
    );
  },
);
ChatbotLauncher.displayName = "ChatbotLauncher";

export default ChatbotLauncher;
