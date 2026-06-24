/**
 * Heuristic 0–100 score for archive display (not a legal compliance audit).
 * Uses volume count, text length, and common regulatory tokens in Arabic/English.
 */
export function computeProposalComplianceDisplayScore(
  draft: string,
  volumeCount: number | null,
): number {
  const t = draft.trim();
  if (!t) return 0;

  const vol =
    typeof volumeCount === "number" && volumeCount > 0
      ? Math.min(45, 22 + volumeCount * 5)
      : 22;
  const len = Math.min(35, (t.length / 100_000) * 35);
  const hints = /SBC|سابكو|SASO|etimad|إطيماد|LCGPA|الكود\s*السعودي|رؤية\s*2030|vision\s*2030|الامتثال/i.test(
    t,
  )
    ? 20
    : 8;

  return Math.min(100, Math.round(vol + len + hints));
}
