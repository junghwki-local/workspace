import type { Metadata, Viewport } from "next";
import { Noto_Serif_KR, Noto_Sans_KR } from "next/font/google";
import { LenisProvider } from "@/lib/lenis-provider";
import "./globals.css";

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://goryeohanji.kr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "고려한지 수의 | 전통과 현대가 만나는 정갈한 아름다움",
    template: "%s | 고려한지 수의",
  },
  description:
    "천년의 숨결을 간직한 한지로 지은 고결한 예복. 전통 한지 장인 정신과 현대적 감각이 만나는 고려한지 수의.",
  keywords: ["한지 수의", "전통 수의", "장례 예복", "고려한지", "한지 공예"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "고려한지 수의",
    description: "천년의 숨결을 간직한 한지로 지은 고결한 예복.",
    siteName: "고려한지 수의",
  },
  twitter: {
    card: "summary_large_image",
    title: "고려한지 수의",
    description: "천년의 숨결을 간직한 한지로 지은 고결한 예복.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#f6efe0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSerifKr.variable} ${notoSansKr.variable}`}>
      <body className="bg-bg text-ink antialiased">
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
