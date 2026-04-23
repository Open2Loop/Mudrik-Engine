/**
 * @project MUDRIK — AI Tender Consultant
 * @file    lib/engine-types.ts
 *
 * Canonical type definitions shared across ALL three layers of the multi-agent
 * pipeline:
 *
 *   • API routes  — app/api/engine/analyze-gaps, estimate-boq, generate-wbs
 *   • Hook        — hooks/useMudrikEngine.ts
 *   • UI          — components/EmeraldUI/{GapAnalysisVisualizer,
 *                    ResourceChipsPlanner, ExecutionVisualizer}.tsx
 *
 * This single source of truth eliminates the three independent definitions
 * that previously existed and enforces compile-time parity between what
 * the backend serialises and what the frontend renders.
 */

// ---------------------------------------------------------------------------
//  Gap Analysis (Compliance Radar)
// ---------------------------------------------------------------------------

export type GapSeverity = "critical" | "weak" | "covered";

export interface GapItem {
  id: number;
  /** Arabic compliance gap description. */
  text: string;
  severity: GapSeverity;
}

// ---------------------------------------------------------------------------
//  Bill of Quantities (Resource Estimator)
// ---------------------------------------------------------------------------

export interface BoqItem {
  id: number;
  /** Item category, e.g. "Software", "Human Resource", "Infrastructure". */
  type: string;
  /** Line-item description in Arabic. */
  item: string;
  /** Cost string, e.g. "24,000 ر.س" or "≈ $6,400". */
  cost: string;
}

/**
 * `ResourceChipsPlanner` uses the name `ResourceItem` for its prop type.
 * It is structurally identical to `BoqItem` — the alias lets both names
 * be used without conversion.
 */
export type ResourceItem = BoqItem;

// ---------------------------------------------------------------------------
//  Work Breakdown Structure (Execution Timeline)
// ---------------------------------------------------------------------------

export type ExecutionState = "pending" | "active" | "done";

export interface WbsItem {
  id: number;
  /** Phase or milestone title, e.g. "التأسيس". */
  phase: string;
  /** Arabic detail / scope line. */
  detail: string;
  /**
   * Roadmap window (chronology). Preferred over `state`.
   * e.g. "الشهر الأول - الشهر الثالث", "الأسبوع 1-2", "مرحلة التسليم"
   */
  timeframe?: string;
  /** Same meaning as `timeframe` if the model uses this key instead. */
  duration_tag?: string;
  /** @deprecated Legacy task status; roadmap UI uses `timeframe` / `duration_tag`. */
  state?: ExecutionState;
}

/**
 * `ExecutionVisualizer` uses the name `ExecutionStep` for its prop type.
 * Structurally identical to `WbsItem`.
 */
export type ExecutionStep = WbsItem;
