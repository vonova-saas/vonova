"use client";

import dynamic from "next/dynamic";
import { GoogleAnalytics } from "@next/third-parties/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { Toaster } from "sonner";
import { ViewTransitions } from "next-view-transitions";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min default - reduces refetches on navigation
    },
  },
});

// Lazy load chatbot widget to improve initial page load (client-side only)
const ChatbotWidget = dynamic(
  () =>
    import("@/components/shared/chatbot/chatbot-widget").then(
      (mod) => mod.default
    ),
  {
    ssr: false,
    loading: () => null,
  }
);

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ViewTransitions>
        <Toaster position="bottom-right" richColors duration={4000} />
        {children}
        <ChatbotWidget />
        <GoogleAnalytics gaId="G-KGPW43F35B" />
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </ViewTransitions>
    </QueryClientProvider>
  );
}

export default Providers;
