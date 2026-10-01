import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  weight: ["600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair-display",
});

export const metadata: Metadata = {
  title: "HiAI-MenuGo — Nền Tảng Quản Lý Nhà Hàng & F&B Thông Minh",
  description: "Hệ thống POS, KDS, QR Menu và Quản trị SaaS F&B Đa Chi Nhánh",
};

import { I18nProvider } from "../context/i18nContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans bg-zinc-950 text-zinc-100 selection:bg-amber-500 selection:text-white">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
