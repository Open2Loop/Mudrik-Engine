/**
 * @project MUDRIK — AI Tender Consultant
 * @file    app/command-center/page.tsx
 *
 * The Emerald Atelier multi-agent engine with the Bento Grid Morphing UI.
 * Routing: /command-center   Nav label: "المحرك"
 *
 * `EmeraldDashboard` is loaded with `dynamic(..., { ssr: false })` so the dev
 * server does not synchronously `require` a large split chunk for this route.
 * That avoids intermittent `Cannot find module './NNN.js'` / 500 after HMR
 * when `.next` chunk ids go stale.
 */

"use client";

import dynamic from "next/dynamic";
import { AppShell } from "@/components/app-shell";

const EmeraldDashboard = dynamic(
  () => import("@/components/EmeraldUI/EmeraldDashboard"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[280px] w-full items-center justify-center rounded-[28px] bg-[#f7fafa] px-6 text-center text-[#003334] shadow-[0_4px_50px_rgba(0,51,52,0.05)]"
        dir="rtl"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="text-sm font-semibold tracking-tight opacity-85">جاري تحميل لوحة المحرك…</span>
      </div>
    ),
  },
);

export default function CommandCenterPage() {
  return (
    <AppShell title="المحرك">
      <EmeraldDashboard />
    </AppShell>
  );
}
