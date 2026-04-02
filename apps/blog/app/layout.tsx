import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LenisProvider from "@/components/animations/LenisProvider";
import CustomCursor from "@/components/animations/CustomCursor";
import QueryProvider from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: {
    default: "Blog",
    template: "%s | Blog",
  },
  description: "WordPress Headless Blog powered by Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-black text-white min-h-screen">
        <QueryProvider>
          <LenisProvider>
            <CustomCursor />
            <Header />
            <main>{children}</main>
            <Footer />
          </LenisProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
