import type { Metadata } from "next";
import type { ReactNode } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export const metadata: Metadata = {
  title: "لوحة التحكم — مُدْرِك",
  description: "منصة مُدْرِك لإدارة المناقصات وعروض الأسعار الفنية.",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div
      dir="rtl"
      style={{
        display: "flex",
        minHeight: "100dvh",
        background: "#f7fafa",
      }}
    >
      <DashboardSidebar />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: "clamp(1.5rem, 3vw, 3rem)",
          overflowX: "hidden",
        }}
      >
        {children}
      </main>
    </div>
  );
}
