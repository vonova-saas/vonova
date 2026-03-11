import { generateMetadata } from "@/utils/functions";
import "../style/globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/providers/theme-provider";
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
        )}
      >
        <Providers>
          <NextTopLoader showSpinner={false} color="black" />
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
