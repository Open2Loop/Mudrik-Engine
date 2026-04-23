"use client";

import React from "react";
import { ARABIC_KEYWORD_BUBBLE_ATELIER_DEFAULT } from "@/lib/arabicKeywordBubbleTone";

/**
 * Fixed layout: padding, radius, type scale — surface (glass + tint) is pluggable
 * for `getArabicKeywordBubbleClasses()`.
 */
const BENTO_BUBBLE_LAYOUT =
  "px-4 py-3 rounded-2xl text-sm font-medium min-w-0 shadow-sm";

export function bentoDataBubbleClass(
  extra?: string,
  surfaceClasses: string = ARABIC_KEYWORD_BUBBLE_ATELIER_DEFAULT,
) {
  return [BENTO_BUBBLE_LAYOUT, surfaceClasses, extra].filter(Boolean).join(" ");
}

type BentoDataBubbleProps = {
  children: React.ReactNode;
  /** Default: `flex items-center gap-2`. Use `flex flex-wrap` for responsive rows. */
  className?: string;
  /** Backdrop, border, text root — e.g. from `getArabicKeywordBubbleClasses(text)`. */
  surfaceClassName?: string;
};

/**
 * Glass-morphism Bento row: premium alignment via flex + flex-wrap in `className`.
 */
export default function BentoDataBubble({
  children,
  className = "flex items-center gap-2",
  surfaceClassName = ARABIC_KEYWORD_BUBBLE_ATELIER_DEFAULT,
}: BentoDataBubbleProps) {
  return <div className={bentoDataBubbleClass(className, surfaceClassName)}>{children}</div>;
}

export { ARABIC_KEYWORD_BUBBLE_ATELIER_DEFAULT } from "@/lib/arabicKeywordBubbleTone";
