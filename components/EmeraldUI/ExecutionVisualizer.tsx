"use client";

/**
 * ExecutionVisualizer — WBS / Execution Roadmap as glass bubbles.
 * Roadmap is chronological: each row shows a phase, detail, and a **timeframe**
 * milestone (no Kanban status chips).
 */

import { motion } from "framer-motion";
import React from "react";
import { getArabicKeywordBubbleClasses } from "@/lib/arabicKeywordBubbleTone";
import type { ExecutionStep } from "@/lib/engine-types";
import BentoDataBubble from "./BentoDataBubble";

export type { ExecutionStep };

const primary = "#003334";
const IBM_PLEX =
  "var(--font-ibm-plex), 'IBM Plex Sans Arabic', system-ui, sans-serif";

const MILESTONE_CHIP =
  "inline-flex max-w-full shrink-0 items-center rounded-full border border-cyan-200/20 bg-cyan-500/10 px-2.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-cyan-800 dark:border-cyan-500/20 dark:text-cyan-400";

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function OrdinalBadge({ index }: { index: number }) {
  return (
    <span
      aria-hidden
      className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-[0.65rem] font-extrabold text-cyan-800 dark:text-cyan-300"
      style={{ fontFamily: IBM_PLEX }}
    >
      {index + 1}
    </span>
  );
}

/** Chronological window from API: `timeframe` or `duration_tag`. */
function resolveTimeframe(step: ExecutionStep): string {
  return (step.timeframe?.trim() || step.duration_tag?.trim() || "").trim();
}

function MilestoneMarker({ text }: { text: string }) {
  if (!text) return null;
  return (
    <span className={MILESTONE_CHIP} dir="rtl" aria-label="النافذة الزمنية">
      [ {text} ]
    </span>
  );
}

const MOCK_STEPS: ExecutionStep[] = [
  {
    id: 1,
    phase: "التحضير والتأسيس",
    detail: "مشاغل الموقع ونسق الاستلام والمخططات التنفيذية المعتمدة.",
    timeframe: "الشهر الأول - الشهر الثاني",
  },
  {
    id: 2,
    phase: "الهياكل والتمديدات",
    detail: "الهيكل الإنشائي والأنظمة MEP حسب البرنامج الزمني المعتمد.",
    timeframe: "الشهر الثالث - السادس",
  },
  {
    id: 3,
    phase: "التجارب والتسليم",
    detail: "اختبارات التشغيل ومحضر الاستلام النهائي.",
    timeframe: "مرحلة التسليم",
  },
];

interface ExecutionVisualizerProps {
  steps?: ExecutionStep[];
  hasError?: boolean;
}

export default function ExecutionVisualizer({ steps: stepsProp, hasError }: ExecutionVisualizerProps) {
  if (hasError) {
    return (
      <div dir="rtl" aria-label="جدول التنفيذ" className="w-full min-w-0">
        <BentoDataBubble
          className="flex flex-wrap items-center justify-end gap-2"
          surfaceClassName={getArabicKeywordBubbleClasses("مرحلة تسليم شهر")}
        >
          <span className="min-w-0 flex-1 text-right text-sm font-medium leading-snug">
            تعذر تحليل البيانات - حاول مرة أخرى.
          </span>
        </BentoDataBubble>
      </div>
    );
  }

  const steps = Array.isArray(stepsProp) && stepsProp.length > 0 ? stepsProp : MOCK_STEPS;

  if (steps.length === 0) {
    return (
      <div dir="rtl" aria-label="جدول التنفيذ" className="w-full min-w-0">
        <BentoDataBubble className="flex flex-wrap items-center gap-2">
          <span className="text-tertiary/90 text-sm font-medium">لم تُستخرج مراحل التنفيذ بعد.</span>
        </BentoDataBubble>
      </div>
    );
  }

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      dir="rtl"
      className="flex flex-col gap-2.5 px-1 pb-1"
      style={{ fontFamily: IBM_PLEX }}
      aria-label="خارطة الطريق التنفيذية"
    >
      {steps.map((step, idx) => {
        const milestone = resolveTimeframe(step);
        const toneSource = [step.phase, step.detail, milestone].filter(Boolean).join(" ");
        return (
          <motion.div key={step.id ?? idx} variants={itemVariants} className="w-full min-w-0">
            <BentoDataBubble
              className="flex w-full min-w-0 flex-col items-stretch gap-2.5"
              surfaceClassName={getArabicKeywordBubbleClasses(toneSource)}
            >
              <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2">
                <OrdinalBadge index={idx} />
                <span
                  className="min-w-0 flex-1 text-right text-sm font-bold leading-snug"
                  style={{ color: primary, fontFamily: IBM_PLEX }}
                >
                  {step.phase}
                </span>
                <MilestoneMarker text={milestone} />
              </div>
              {step.detail ? (
                <span
                  className="block w-full pr-0 text-right text-xs font-medium leading-relaxed"
                  style={{
                    fontFamily: IBM_PLEX,
                    color: "rgba(0, 51, 52, 0.82)",
                    opacity: 0.9,
                  }}
                >
                  {step.detail}
                </span>
              ) : null}
            </BentoDataBubble>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
