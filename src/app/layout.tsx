import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/util/theme.provider";
import QueryProvider from "@/util/query.provider";

export const metadata: Metadata = {
  title: "SecretManager - panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
