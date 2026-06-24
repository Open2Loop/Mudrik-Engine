/**
 * Committee War Room — shared types (API + UI). Isolated from the engine stream.
 */

export type CommitteeSuggestion = {
  /** Client-generated for React keys; optional in raw API payload */
  id: string;
  agentName: string;
  section: string;
  issue: string;
  /** Exact span from the proposal; used for apply/replace on Accept */
  originalText: string;
  suggestedText: string;
  status: "pending" | "accepted" | "skipped";
};

export const COMMITTEE_AGENTS = [
  {
    id: "legal" as const,
    name: "المستشار القانوني",
    subtitle: "عقود وعقود جزائية وامتثال",
    color: "rgba(59, 130, 246, 0.25)",
  },
  {
    id: "technical" as const,
    name: "الخبير الفني",
    subtitle: "منهجية التنفيذ والمواصفات",
    color: "rgba(16, 185, 129, 0.28)",
  },
  {
    id: "financial" as const,
    name: "المدقق المالي",
    subtitle: "التسعير والموارد",
    color: "rgba(212, 175, 55, 0.28)",
  },
];
