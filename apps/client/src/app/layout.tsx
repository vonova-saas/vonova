import { generateMetadata } from "@/utils/functions/metadata";
import "../style/globals.css";
import { cn } from "@/lib/utils";
// import { inter, satoshi } from "@/utils/constants";
import { ThemeProvider } from "@/providers/theme-provider";

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
          // inter.variable,
          // satoshi.variable
        )}
      >
        {/* <AuthProvider>
          <QueryProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </QueryProvider>
        </AuthProvider> */}
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
