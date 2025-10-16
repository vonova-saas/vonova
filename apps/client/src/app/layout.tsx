import { generateMetadata } from "@/utils/functions";
import "../style/globals.css";
import { cn } from "@/lib/utils";
import { lato, cairo } from "@/utils/constants";
import { ThemeProvider } from "@/providers/theme-provider";
import ChatbotWidget from "@/components/shared/chatbot/chatbot-widget";
import Providers from "@/providers/providers";
import NextTopLoader from "nextjs-toploader";

export const metadata = generateMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "overflow-x-hidden antialiased",
          lato.variable,
          cairo.variable,
        )}
      >
        <Providers>
          <NextTopLoader showSpinner={false} color="black" />
          <ThemeProvider>
            {children}
            <ChatbotWidget />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
