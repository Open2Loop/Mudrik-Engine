import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ملف الشركة",
  description:
    "تعريف قدرات الشركة والشهادات والخبرات السابقة لحقنها تلقائياً في العروض الفنية للمناقصات.",
  alternates: { canonical: "/company-profile" },
};

export default function CompanyProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
