import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "المحرك — مناقصة",
  description: "محرك توليد العروض الفنية متعددة الوكلاء مع تحليل الامتثال وتقدير الموارد.",
};

/**
 * Server layout holds route metadata; the page is a Client Component so the
 * server bundle stays minimal — reduces dev HMR “missing chunk” (.js) failures
 * after hot reload when a large client tree is co-located with metadata.
 */
export default function CommandCenterLayout({ children }: { children: ReactNode }) {
  return children;
}
