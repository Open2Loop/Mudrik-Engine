import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الإعدادات",
  description:
    "إعداد مفتاح Gemini أو OpenAI الخاص بك (BYOK) واختيار محرك التوليد — بدون مفاتيح مشتركة على الخادم.",
  alternates: { canonical: "/settings" },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
