import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الأرشيف",
  description:
    "أرشفة العروض الفنية والمسودات المُولَّدة مع تتبع الإصدارات وإعادة استخدام المحتوى المعتمد.",
  alternates: { canonical: "/archive" },
};

export default function ArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
