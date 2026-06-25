import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الخزنة",
  description:
    "رفع وتخزين كراسات الشروط والمرفقات مع فهرسة نصية وبحث دلالي عبر مشاريع المناقصات السابقة.",
  alternates: { canonical: "/vault" },
};

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
