"use client";

import { ComplianceScore } from "@/components/ComplianceScore";

type Props = {
  value: number;
  active: boolean;
  isGenerating: boolean;
  title?: string;
};

/** Alias for Emerald dashboard: prestige paper + streaming beam (see `ComplianceScore`). */
export function ComplianceScoreDisplay({ value, active, isGenerating, title = "مؤشر مطابقة المعايير" }: Props) {
  return (
    <ComplianceScore value={value} active={active} isGenerating={isGenerating} label={title} />
  );
}
