/**
 * @project MUDRIK - AI Tender Consultant
 * @author Al-Baraa | البراء
 * @created March 2026
 * @status Stable Version 1.0
 * @copyright (c) 2026 All Rights Reserved
 * @legal_notice This source code and all its algorithms are the sole property of Al-Baraa.
 * Any unauthorized copying, modification, or distribution is strictly prohibited.
 * مشروع مُدْرِك - مستشار المنافسات الذكي
 * حقوق الملكية محفوظة (ج) ٢٠٢٦ - المؤلف: البراء
 */

import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-ibm-plex",
});

export const metadata: Metadata = {
  title: "مُدْرِك | المنصة الذكية لتحليل وإعداد عروض المناقصات والمزايدات",
  description:
    "أتمتة دورة حياة تحليل كراسات الشروط بدقة عالية، مع مطابقة المتطلبات مع الخبرات السابقة وتوليد مسودات العروض المتوافقة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html dir="rtl" lang="ar">
      <body
        className={`${ibmPlexSansArabic.variable} ${ibmPlexSansArabic.className} min-h-screen bg-white font-sans text-charcoal antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
