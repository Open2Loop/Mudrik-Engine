"use client";

import React from "react";
import { getArabicKeywordBubbleClasses } from "@/lib/arabicKeywordBubbleTone";
import type { GapItem, GapSeverity } from "@/lib/engine-types";
import BentoDataBubble from "./BentoDataBubble";

export type { GapItem };

interface EmptyStateProps {
  title: string;
  description: string;
}

interface GapAnalysisVisualizerProps {
  gaps?: GapItem[];
  hasError?: boolean;
}

const mockGapData: GapItem[] = [
  { id: 1, text: "Missing Cybersecurity Standards", severity: "critical" },
  { id: 2, text: "Timeline loosely defined", severity: "weak" },
  { id: 3, text: "SLA requirements met", severity: "covered" },
];

const severityLabel: Record<GapSeverity, string> = {
  critical: "Critical Gap",
  weak: "Weak Area",
  covered: "Covered",
};

const severityDot: Record<GapSeverity, string> = {
  critical: "bg-primary ring-2 ring-primary/25",
  weak: "bg-secondary ring-2 ring-secondary/20",
  covered: "bg-secondary/80 ring-1 ring-secondary/30",
};

function EmptyBubbles({ title, description }: EmptyStateProps) {
  return (
    <BentoDataBubble className="flex flex-wrap items-center gap-2" aria-live="polite">
      <span className="text-primary font-bold shrink-0">{title}</span>
      <span className="text-secondary text-sm font-medium opacity-90 min-w-0">{description}</span>
    </BentoDataBubble>
  );
}

export default function GapAnalysisVisualizer({ gaps: gapsProp, hasError }: GapAnalysisVisualizerProps) {
  const gaps: GapItem[] = Array.isArray(gapsProp) ? gapsProp : mockGapData;

  if (hasError) {
    return (
      <div className="w-full flex flex-col gap-3" dir="rtl" aria-label="Gap analysis visualizer">
        <BentoDataBubble
          className="flex flex-wrap items-center justify-end gap-2"
          surfaceClassName={getArabicKeywordBubbleClasses("مخاطر تحليل البيانات")}
        >
          <span className="min-w-0 flex-1 text-right text-sm font-medium leading-snug">
            تعذر تحليل البيانات - حاول مرة أخرى.
          </span>
        </BentoDataBubble>
      </div>
    );
  }

  if (!gaps || gaps.length === 0) {
    return (
      <div className="w-full flex flex-col gap-3" dir="rtl" aria-label="Gap analysis visualizer">
        <EmptyBubbles
          title="No gap data"
          description="Gap analysis will appear here once items are returned."
        />
      </div>
    );
  }

  return (
    <div
      className="w-full flex flex-col gap-3"
      dir="rtl"
      aria-label="Gap analysis visualizer"
    >
      {gaps.map((gap, idx) => (
        <BentoDataBubble
          key={gap?.id ?? `gap-${idx}`}
          className="flex w-full min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1.5"
          surfaceClassName={getArabicKeywordBubbleClasses(gap?.text ?? "")}
        >
          <span
            className={`inline-flex h-2 w-2 shrink-0 rounded-full ${severityDot[gap?.severity ?? "weak"]}`}
            aria-hidden
          />
          <span className="shrink-0 text-[0.7rem] font-bold uppercase tracking-wide text-inherit opacity-75">
            {severityLabel[gap?.severity ?? "weak"]}
          </span>
          <span className="min-w-0 flex-1 text-right font-medium leading-snug text-inherit">
            {gap?.text ?? ""}
          </span>
        </BentoDataBubble>
      ))}
    </div>
  );
}
