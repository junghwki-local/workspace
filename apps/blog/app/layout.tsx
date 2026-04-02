import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LenisProvider from "@/components/animations/LenisProvider";
import CustomCursor from "@/components/animations/CustomCursor";
import QueryProvider from "@/components/providers/QueryProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "Blog",
    template: "%s | Blog",
  },
  description: "WordPress Headless Blog powered by Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
        <SessionProvider>
        <QueryProvider>
          <LenisProvider>
            <CustomCursor />
            <Header />
            <main>{children}</main>
            <Footer />
            <Toaster theme="system" position="bottom-right" richColors />
          </LenisProvider>
        </QueryProvider>
        </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
