/**
 * Semantic surfaces for Bento bubbles: Arabic keyword → soft tint, Emerald Atelier–aligned.
 * First matching category wins: risk → compliance → resources → neutral → default.
 */

const NFKC = (s: string) => s.normalize("NFKC").trim();

/** Default when no keyword matches — deep emerald glass (brand). */
export const ARABIC_KEYWORD_BUBBLE_ATELIER_DEFAULT =
  "backdrop-blur-sm bg-primary/20 text-primary/90 border border-white/10 " +
  "dark:text-surface/95 dark:bg-primary/25";

export type ArabicKeywordBubbleId =
  | "risk"
  | "compliance"
  | "resources"
  | "neutral"
  | "default";

const RULES: ReadonlyArray<{
  id: ArabicKeywordBubbleId;
  keywords: readonly string[];
  /** Background + text (+ border for premium edge alignment). */
  classes: string;
}> = [
  {
    id: "risk",
    keywords: ["مخاطر", "نواقص", "تحذير"],
    classes:
      "backdrop-blur-sm bg-red-500/10 text-red-700 border border-red-200/20 " +
      "dark:border-red-500/20 dark:text-red-400",
  },
  {
    id: "compliance",
    keywords: ["مطابق", "معتمد", "نجاح"],
    classes:
      "backdrop-blur-sm bg-emerald-500/10 text-emerald-700 border border-emerald-200/20 " +
      "dark:border-emerald-500/20 dark:text-emerald-400",
  },
  {
    id: "resources",
    keywords: ["تكلفة", "موارد", "ميزانية"],
    classes:
      "backdrop-blur-sm bg-[#D4AF37]/10 text-[#D4AF37] border border-amber-200/25 " +
      "dark:border-[#D4AF37]/30",
  },
  {
    id: "neutral",
    keywords: ["مرحلة", "تسليم", "شهر"],
    classes:
      "backdrop-blur-sm bg-cyan-500/10 text-cyan-700 border border-cyan-200/20 " +
      "dark:border-cyan-500/20 dark:text-cyan-400",
  },
] as const;

/**
 * Returns Tailwind classes for the full bubble “surface” (glass + color).
 * @param text — any string; typically Arabic; English falls through to default.
 */
export function getArabicKeywordBubbleClasses(text: string | undefined | null): string {
  if (text == null) return ARABIC_KEYWORD_BUBBLE_ATELIER_DEFAULT;
  const t = NFKC(text);
  if (!t) return ARABIC_KEYWORD_BUBBLE_ATELIER_DEFAULT;

  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (t.includes(kw)) {
        return rule.classes;
      }
    }
  }
  return ARABIC_KEYWORD_BUBBLE_ATELIER_DEFAULT;
}

/**
 * For analytics / testing: which category matched (or `default`).
 */
export function getArabicKeywordBubbleId(text: string | undefined | null): ArabicKeywordBubbleId {
  if (text == null) return "default";
  const t = NFKC(text);
  if (!t) return "default";
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (t.includes(kw)) return rule.id;
    }
  }
  return "default";
}
