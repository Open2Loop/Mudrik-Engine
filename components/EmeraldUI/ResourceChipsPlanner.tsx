"use client";

import React from "react";
import { getArabicKeywordBubbleClasses } from "@/lib/arabicKeywordBubbleTone";
import type { ResourceItem } from "@/lib/engine-types";
import BentoDataBubble from "./BentoDataBubble";

export type { ResourceItem };

interface EmptyStateProps {
  title: string;
  description: string;
}

interface ResourceChipsPlannerProps {
  resources?: ResourceItem[];
  hasError?: boolean;
}

const mockBoqData: ResourceItem[] = [
  { id: 1, type: "Software", item: "Enterprise License", cost: "$5,000" },
  { id: 2, type: "Human Resource", item: "Senior Architect - 40hrs", cost: "$3,200" },
  { id: 3, type: "Infrastructure", item: "Cloud Compute Allocation", cost: "$1,850" },
  { id: 4, type: "Compliance", item: "Security Audit Package", cost: "$2,400" },
];

const iconWrapClass =
  "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15";

const iconDotClass = "h-2.5 w-2.5 rounded-full bg-secondary";

function EmptyBubbles({ title, description }: EmptyStateProps) {
  return (
    <BentoDataBubble className="flex flex-wrap items-center gap-2" aria-live="polite">
      <span className="text-primary font-bold shrink-0">{title}</span>
      <span className="text-secondary text-sm font-medium opacity-90 min-w-0">{description}</span>
    </BentoDataBubble>
  );
}

export default function ResourceChipsPlanner({ resources: resourcesProp, hasError }: ResourceChipsPlannerProps) {
  const resources: ResourceItem[] = Array.isArray(resourcesProp) ? resourcesProp : mockBoqData;

  if (hasError) {
    return (
      <div className="w-full flex flex-col gap-3" dir="rtl" aria-label="Smart pricing tags and bill of quantities">
        <BentoDataBubble
          className="flex flex-wrap items-center justify-end gap-2"
          surfaceClassName={getArabicKeywordBubbleClasses("تكلفة الموارد ميزانية")}
        >
          <span className="min-w-0 flex-1 text-right text-sm font-medium leading-snug">
            تعذر تحليل البيانات - حاول مرة أخرى.
          </span>
        </BentoDataBubble>
      </div>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <div className="w-full flex flex-col gap-3" dir="rtl" aria-label="Smart pricing tags and bill of quantities">
        <EmptyBubbles
          title="No BoQ data"
          description="Resource tags will appear once bill of quantities data is returned."
        />
      </div>
    );
  }

  return (
    <div
      className="w-full flex flex-col gap-3"
      dir="rtl"
      aria-label="Smart pricing tags and bill of quantities"
    >
      {resources.map((resource) => {
        const rowSource = `${resource?.type ?? ""} ${resource?.item ?? ""} ${resource?.cost ?? ""}`;
        return (
        <BentoDataBubble
          key={resource.id}
          className="group flex w-full min-w-0 flex-wrap items-center justify-end gap-2 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-[#003334] hover:via-[rgba(0,51,52,0.88)] hover:to-[#006a67] hover:shadow-lg hover:shadow-primary/20 hover:text-surface"
          surfaceClassName={getArabicKeywordBubbleClasses(rowSource)}
        >
          <span
            aria-hidden="true"
            className={`${iconWrapClass} group-hover:bg-surface/20`}
          >
            <span
              className={`${iconDotClass} group-hover:bg-surface/90`}
            />
          </span>
          <span className="shrink-0 text-[0.7rem] font-bold uppercase tracking-wide text-inherit opacity-90 group-hover:opacity-100 group-hover:text-surface">
            {resource.type}
          </span>
          <span className="min-w-0 flex-1 text-right font-medium leading-snug text-inherit group-hover:text-surface">
            {resource.item}
          </span>
          <span
            data-bento-gold
            className="shrink-0 text-base font-bold tabular-nums text-inherit group-hover:text-surface"
          >
            {resource.cost}
          </span>
        </BentoDataBubble>
        );
      })}
    </div>
  );
}
