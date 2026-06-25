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
import { AnonymousSessionProvider } from "@/components/AnonymousSessionProvider";
import { JsonLdWebApp } from "@/components/json-ld-web-app";
import {
  BRAND_NAME,
  BRAND_NAME_EN,
  BRAND_TAGLINE,
  GITHUB_REPO_URL,
} from "@/lib/brand";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-ibm-plex",
});

const defaultTitle = `${BRAND_NAME} | ${BRAND_TAGLINE}`;
const defaultDescription =
  "منصة عربية مفتوحة المصدر لأتمتة دورة حياة المناقصة: تحليل كراسات الشروط، فحص الامتثال، توليد العروض الفنية، والتصدير إلى DOCX — بدون تسجيل دخول. Open-source Saudi tender and RFP platform with BYOK AI.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: `%s | ${BRAND_NAME}`,
  },
  description: defaultDescription,
  keywords: [
    "مناقصة",
    "مناقصات",
    "كراسة الشروط",
    "عروض فنية",
    "مناقصات حكومية",
    "السعودية",
    "اعتماد",
    "إتماد",
    "SBC",
    "SASO",
    "LCGPA",
    "Munakasa",
    "Saudi tender",
    "RFP",
    "government procurement",
    "technical proposal",
    "tender analysis",
    "DOCX export",
    "compliance",
    "open source",
    "BYOK",
  ],
  authors: [{ name: "Al-Baraa", url: GITHUB_REPO_URL }],
  creator: "Al-Baraa",
  publisher: BRAND_NAME_EN,
  applicationName: BRAND_NAME_EN,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: SITE_URL,
    siteName: `${BRAND_NAME} · ${BRAND_NAME_EN}`,
    title: `${BRAND_NAME} — ${BRAND_NAME_EN}`,
    description: defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} · ${BRAND_NAME_EN}`,
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "business",
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
        <JsonLdWebApp />
        <AnonymousSessionProvider>{children}</AnonymousSessionProvider>
      </body>
    </html>
  );
}
