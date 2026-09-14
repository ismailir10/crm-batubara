import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CRM Batubara — Prototipe Demo",
    template: "%s · CRM Batubara",
  },
  description:
    "Prototipe CRM terintegrasi untuk bisnis batubara: prospek, opportunity, persetujuan penjualan, kontrak, delivery order, dan intelijen harga batubara. Seluruh data bersifat sintetis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
