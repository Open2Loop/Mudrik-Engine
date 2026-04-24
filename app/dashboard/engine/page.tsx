/**
 * app/dashboard/engine/page.tsx
 *
 * Hosts EmeraldDashboard inside the dashboard sidebar layout.
 * Dynamic import (ssr:false) prevents stale .next chunk errors after HMR,
 * identical to the pattern used in /command-center.
 */
"use client";

import dynamic from "next/dynamic";

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
        <span className="text-sm font-semibold tracking-tight opacity-85">
          جاري تحميل لوحة المحرك…
        </span>
      </div>
    ),
  },
);

export default function DashboardEnginePage() {
  return (
    <div dir="rtl">
      <div style={{ marginBottom: "clamp(1rem, 2.5vh, 2.5rem)" }}>
        <p
          style={{
            margin: 0,
            color: "#006a67",
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily:
              "var(--font-ibm-plex), 'IBM Plex Sans Arabic', system-ui, sans-serif",
          }}
        >
          AI Proposal Engine
        </p>
        <h1
          style={{
            margin: "6px 0 10px",
            color: "#003334",
            fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)",
            fontWeight: 700,
            lineHeight: 1.2,
            fontFamily:
              "var(--font-ibm-plex), 'IBM Plex Sans Arabic', system-ui, sans-serif",
          }}
        >
          محرك التوليد الذكي
        </h1>
        <div
          style={{
            height: 3,
            width: 40,
            borderRadius: 2,
            background: "linear-gradient(to left, #006a67, #D4AF37)",
          }}
        />
      </div>
      <EmeraldDashboard />
    </div>
  );
}
