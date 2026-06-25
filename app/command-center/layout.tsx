import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "محرك التوليد",
  description:
    "تحليل كراسات الشروط، استخراج المتطلبات، وتوليد العروض الفنية مع تقدير WBS وBOQ — محرك مناقصة الذكي.",
  alternates: { canonical: "/command-center" },
};

export default function CommandCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
