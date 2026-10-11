import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  weight: ["600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MenuGO by HiAI — Quản Lý Nhà Hàng & F&B Thông Minh",
  description: "MenuGO by HiAI: đặt món, quản lý bàn, thực đơn, khách hàng và báo cáo cho nhà hàng",
};

import { I18nProvider } from "../context/i18nContext";
import { SocketProvider } from "../context/SocketContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#F4F6F8] text-[#0F172A] selection:bg-[#00A389] selection:text-white">
        <I18nProvider>
          <SocketProvider>{children}</SocketProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
