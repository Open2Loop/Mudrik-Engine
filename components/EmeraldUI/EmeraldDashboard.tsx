"use client";

/**
 * EmeraldDashboard — The Emerald Atelier Command Center
 *
 * Two-state morphing UI:
 *   INPUT_STATE  — right panel shows a clean form (project details + RFP paste).
 *   ANALYSIS_STATE — on "Generate", the form exits and three Bento cards
 *                    materialize in its place via Framer Motion. Grid: two
 *                    columns on md+; Timeline (execution) spans full width.
 *
 * Animation contract (Quiet Luxury):
 *   - Form exit:  0.28 s, ease-in back  [0.36, 0, 0.66, -0.56]
 *   - Bento cards: 0.8 s, [0.22, 1, 0.36, 1]; stagger 0.2 / 0.4 / 0.6 s; rise y:30
 *
 * No-Line rule: zero `border` properties on layout/section elements.
 * Only ghost borders (secondary @ 15 % alpha) appear on interactive inputs
 * for accessibility. Separation comes from tonal background shifts.
 *
 * Gold-Accent (#D4AF37) appears ONLY when real data has arrived:
 *   - Heading borderBottom on Bento cards fades in after API resolves.
 *   - Cost figures in ResourceChipsPlanner use gold (it only renders with data).
 */

import { AnimatePresence, motion } from "framer-motion";
import { FileSearch, FileText, Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { MudrikLogo } from "@/components/mudrik-logo";
import { useMudrikEngine } from "@/hooks/useMudrikEngine";
import { useSmoothTypingBuffer } from "@/hooks/useSmoothTypingBuffer";
import { useProposalsStore } from "@/lib/proposals-store";
import CommitteeSimulator from "./CommitteeSimulator";
import ExecutionVisualizer from "./ExecutionVisualizer";
import GapAnalysisVisualizer from "./GapAnalysisVisualizer";
import { PremiumMarkdownViewer } from "./PremiumMarkdownViewer";
import ResourceChipsPlanner from "./ResourceChipsPlanner";

// ---------------------------------------------------------------------------
//  Design tokens
// ---------------------------------------------------------------------------

const surface = "#f7fafa";
const secondary = "#006a67";
const primary = "#003334";
const tertiary = "#242e38";
const goldVeil = "rgba(212, 175, 55, 0.2)";
const gold = "#D4AF37";

// IBM Plex Sans Arabic is the authoritative typeface for the Mudrik platform.
// The CSS variable is injected by next/font in app/layout.tsx.
// Never quote `var(--font-ibm-plex)` — quotes make the browser search for a
// literal font name and skip the loaded face, falling back to Naskh/system.
const IBM_PLEX =
  "var(--font-ibm-plex), 'IBM Plex Sans Arabic', system-ui, sans-serif";

// "Quiet Luxury" easing curve — slow, deliberate deceleration.
const EASE = [0.22, 1, 0.36, 1] as const;
// "Pulled away" easing for the form exit — gives a physical recession feel.
const EASE_IN_BACK = [0.36, 0, 0.66, -0.56] as const;

const SCROLL_STICKY_THRESHOLD_PX = 32;

/** Shared Framer Motion `layoutId` — morphs the white surface between form and Bento. */
const BENTO_MORPH_LAYOUT_ID = "emerald-bento-morph";

const bentoShellStyle: CSSProperties = {
  background: surface,
  borderRadius: 28,
  padding: 28,
  width: "100%",
  boxSizing: "border-box",
  boxShadow: "0 4px 50px rgba(0, 51, 52, 0.05)",
};

// ---------------------------------------------------------------------------
//  Panel state
// ---------------------------------------------------------------------------

type PanelState = "input" | "analysis";

// ---------------------------------------------------------------------------
//  Bento skeleton — emerald high-polish shimmer (see `globals.css`)
// ---------------------------------------------------------------------------

const BENTO_CASCADE_DURATION = 0.8;
const BENTO_CASCADE_EASING = EASE;

function ShimmerLine({ height = 14, delayMs = 0 }: { height?: number; delayMs?: number }) {
  return (
    <div
      className="bento-shimmer-line"
      aria-hidden
      style={{ height, animationDelay: `${delayMs}ms` }}
    />
  );
}

function ShimmerBlock({ lines = 3, baseDelay = 0 }: { lines?: number; baseDelay?: number }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerLine key={i} height={i === 0 ? 16 : 13} delayMs={baseDelay + i * 90} />
      ))}
    </div>
  );
}

function BoxSkeleton({ baseDelay = 0 }: { baseDelay?: number }) {
  return (
    <div style={{ display: "grid", gap: 14, padding: 16 }} aria-busy="true" aria-live="polite">
      <ShimmerBlock lines={1} baseDelay={baseDelay} />
      <ShimmerBlock lines={3} baseDelay={baseDelay + 50} />
      <ShimmerBlock lines={2} baseDelay={baseDelay + 140} />
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Shared input / button style atoms
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 12,
  /*
   * No-Line rule: form fields use zero borders.  The resting state is a
   * tonal shift (soft emerald-tint fill) that sits slightly "below" the
   * surrounding surface; focus is communicated via the global
   * :focus-visible ring in globals.css.
   */
  border: "none",
  background: "rgba(0, 106, 103, 0.055)",
  color: primary,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  boxShadow: "inset 0 1px 2px rgba(0, 51, 52, 0.05)",
  direction: "rtl",
};

// ---------------------------------------------------------------------------
//  Main component
// ---------------------------------------------------------------------------

export default function EmeraldDashboard() {
  const {
    proposalText,
    gapsData,
    boqData,
    wbsData,
    isGeneratingText,
    isAnalyzingMetadata,
    streamProgress,
    streamPhase,
    error,
    gapsError,
    boqError,
    wbsError,
    startGeneration,
    reset,
  } = useMudrikEngine();

  const gapsList = Array.isArray(gapsData) ? gapsData : [];
  const boqList = Array.isArray(boqData) ? boqData : [];
  const wbsList = Array.isArray(wbsData) ? wbsData : [];

  /** Renders a steady, high-speed “typing” reveal on top of chunky SSE chunks. */
  const streamingDisplay = useSmoothTypingBuffer(proposalText ?? "", isGeneratingText);

  const [panelState, setPanelState] = useState<PanelState>("input");
  const [projectName, setProjectName] = useState("");
  const [ownerEntity, setOwnerEntity] = useState("");
  const [executionDuration, setExecutionDuration] = useState("");
  const [rfpText, setRfpText] = useState("");
  const { addProposal } = useProposalsStore();
  const [exportState, setExportState] = useState<"idle" | "working">("idle");
  const [exportError, setExportError] = useState<string | null>(null);
  const [archiveSaved, setArchiveSaved] = useState(false);
  const [fileAnalyzing, setFileAnalyzing] = useState(false);
  const [analyzedFilename, setAnalyzedFilename] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const textContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const [barVisible, setBarVisible] = useState(false);
  const barHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gold accent gates — headings get the gold rule only once real data arrives.
  const gapsHasData = gapsList.length > 0;
  const boqHasData = boqList.length > 0;
  const wbsHasData = wbsList.length > 0;
  // Per-panel error: only show error on the specific card that failed, not all three.
  const gapsHasError = !!gapsError && !isAnalyzingMetadata;
  const boqHasError = !!boqError && !isAnalyzingMetadata;
  const wbsHasError = !!wbsError && !isAnalyzingMetadata;
  const gapsReady = gapsHasData || gapsHasError;
  const boqReady = boqHasData || boqHasError;
  const wbsReady = wbsHasData || wbsHasError;

  const canSubmit = rfpText.trim().length > 0 && !isGeneratingText;

  // ---------------------------------------------------------------------------
  //  Handlers
  // ---------------------------------------------------------------------------

  const analyzeFile = useCallback(async (file: File) => {
    const accepted = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!accepted.includes(file.type)) {
      setFileError("يُقبل ملفات PDF أو DOCX فقط.");
      return;
    }
    setFileError(null);
    setFileAnalyzing(true);
    try {
      const fd = new FormData();
      fd.set("rfp", file);
      const res = await fetch("/api/engine/analyze", { method: "POST", body: fd });
      const raw = await res.text();
      if (!res.ok) {
        setFileError("تعذر استخراج النص من الملف. حاول مرة أخرى.");
        return;
      }
      const cleaned = raw
        .replace(/^```(?:json|text|markdown)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      let data: { text?: string; filename?: string };
      try {
        data = JSON.parse(cleaned) as { text?: string; filename?: string };
      } catch {
        setFileError("استجابة غير صالحة من خادم التحليل.");
        return;
      }
      setRfpText(data.text ?? "");
      setAnalyzedFilename(data.filename ?? file.name);
    } catch {
      setFileError("تعذر الاتصال بخادم التحليل. تحقق من الشبكة.");
    } finally {
      setFileAnalyzing(false);
    }
  }, []);

  const handleGenerate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!rfpText.trim()) return;
      setPanelState("analysis");
      await startGeneration({
        projectName: projectName.trim(),
        ownerEntity: ownerEntity.trim(),
        executionDuration: executionDuration.trim(),
        rfpText: rfpText.trim(),
      });
    },
    [rfpText, projectName, ownerEntity, executionDuration, startGeneration],
  );

  const handleReset = useCallback(() => {
    reset();
    setPanelState("input");
    setExportError(null);
    setAnalyzedFilename(null);
    setFileError(null);
    setArchiveSaved(false);
  }, [reset]);

  const handleSaveToArchive = useCallback(() => {
    if (!proposalText) return;
    addProposal({
      title: projectName.trim() || "عرض فني",
      ownerEntity: ownerEntity.trim(),
      text: proposalText,
    });
    setArchiveSaved(true);
  }, [addProposal, proposalText, projectName, ownerEntity]);

  const handleExportWord = useCallback(async () => {
    if (!(proposalText ?? "").trim() || exportState === "working") return;
    setExportState("working");
    setExportError(null);
    try {
      const response = await fetch("/api/export/word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalText,
          title: projectName.trim() || "العرض الفني الرسمي",
          subtitle: ownerEntity.trim() || undefined,
          preparedBy: "Prepared by Mudrik AI · مُدْرِك",
          filename: "Mudrik_Official_Proposal.docx",
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "فشل تصدير الملف.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Mudrik_Official_Proposal.docx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "فشل تصدير الملف.");
    } finally {
      setExportState("idle");
    }
  }, [exportState, ownerEntity, projectName, proposalText]);

  const handleScroll = useCallback(() => {
    const node = textContainerRef.current;
    if (!node) return;
    const d = node.scrollHeight - node.scrollTop - node.clientHeight;
    autoScrollRef.current = d <= SCROLL_STICKY_THRESHOLD_PX;
  }, []);

  // Show progress bar while generating; hide 1.1 s after completion.
  useEffect(() => {
    if (isGeneratingText || isAnalyzingMetadata) {
      if (barHideTimerRef.current) clearTimeout(barHideTimerRef.current);
      setBarVisible(true);
    } else if (barVisible) {
      barHideTimerRef.current = setTimeout(() => setBarVisible(false), 1100);
    }
    return () => {
      if (barHideTimerRef.current) clearTimeout(barHideTimerRef.current);
    };
  }, [isGeneratingText, isAnalyzingMetadata, barVisible]);

  // Auto-scroll as visible text (smooth buffer) and/or source proposal grows.
  useEffect(() => {
    const node = textContainerRef.current;
    if (!node || !autoScrollRef.current) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [proposalText, streamingDisplay]);

  // Abort on unmount.
  useEffect(() => () => reset(), [reset]);

  // ---------------------------------------------------------------------------
  //  Bento card definitions (avoids repetition in JSX)
  // ---------------------------------------------------------------------------

  // Industry-standard names — no marketing fluff. Aligned with Saudi
  // government procurement nomenclature (منصة اعتماد / وزارة المالية).
  const bentoCards = [
    {
      id: "compliance",
      label: "Compliance Analysis",
      title: "تحليل الامتثال",
      ready: gapsReady,
      hasData: gapsHasData,
      hasError: gapsHasError,
      visualizer: <GapAnalysisVisualizer gaps={gapsList} hasError={gapsHasError} />,
      skeletonBaseDelay: 0,
      /** Staggered cascade: card 1 / 2 / 3 (seconds) */
      staggerEnterDelay: 0.2,
    },
    {
      id: "resources",
      label: "Resource Estimation",
      title: "تقدير الموارد",
      ready: boqReady,
      hasData: boqHasData,
      hasError: boqHasError,
      visualizer: <ResourceChipsPlanner resources={boqList} hasError={boqHasError} />,
      skeletonBaseDelay: 40,
      staggerEnterDelay: 0.4,
    },
    {
      id: "timeline",
      label: "Project Schedule",
      title: "خريطة التنفيذ",
      ready: wbsReady,
      hasData: wbsHasData,
      hasError: wbsHasError,
      visualizer: <ExecutionVisualizer steps={wbsList} hasError={wbsHasError} />,
      skeletonBaseDelay: 80,
      staggerEnterDelay: 0.6,
    },
  ] as const;

  // ---------------------------------------------------------------------------
  //  Render
  // ---------------------------------------------------------------------------

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        fontFamily: IBM_PLEX,
      }}
    >
      {/* ================================================================
          TOP — Dark immersive reader (full-width, always visible)
          ================================================================ */}
      <article
        style={{
          background: primary,
          borderRadius: 28,
          padding: 28,
          minHeight: 480,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 50px rgba(0, 51, 52, 0.12)",
          position: "relative",
          fontFamily: IBM_PLEX,
        }}
      >
        {/* ================================================================
            LOGO BADGE — 80×80, top-left of the dark panel, backdrop-blur.
            Placed inside the article so it never overlaps the right panel.
            ================================================================ */}
        <div
          aria-label="Mudrik — مُدْرِك"
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 10,
            pointerEvents: "none",
            width: 56,
            height: 56,
            borderRadius: 16,
            display: "grid",
            placeItems: "center",
            background: "rgba(247, 250, 250, 0.10)",
            backdropFilter: "blur(16px) saturate(160%)",
            WebkitBackdropFilter: "blur(16px) saturate(160%)",
            boxShadow:
              "0 6px 24px rgba(0, 51, 52, 0.18), inset 0 0 0 1px rgba(212, 175, 55, 0.18)",
          }}
        >
          <MudrikLogo size={28} />
        </div>

        {/* ================================================================
            ROYAL PROGRESS BAR
            Two distinct phases driven by streamPhase:
            
            PHASE 1 — "awaiting" (Writer running, no bytes yet):
              An indeterminate shimmer slides left→right continuously so the
              user always sees motion. The shimmer fades the gradient from
              transparent → #006a67 → #D4AF37 → transparent.
            
            PHASE 2 — "streaming" (QA streaming, chars arriving):
              A solid fill bar grows from 0% → up to 92% driven by the real
              streamed character count, then snaps to 100% on completion.
            
            No-Line rule: the bar floats 2 px above the panel edge via an
            inset from the container (no hard 1 px separator — it's a glow).
            ================================================================ */}
        <AnimatePresence>
          {barVisible && (
            <motion.div
              key="progress-track"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                borderRadius: "28px 28px 0 0",
                background: "rgba(247, 250, 250, 0.05)",
                overflow: "hidden",
              }}
            >
              {streamPhase === "awaiting" ? (
                /* ── Indeterminate metallic-gold shimmer (Writer phase) ── */
                <motion.div
                  animate={{ x: ["-100%", "180%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.6,
                    ease: [0.22, 1, 0.36, 1],
                    repeatDelay: 0.1,
                  }}
                  style={{
                    position: "absolute",
                    width: "55%",
                    height: "100%",
                    /*
                     * Metallic gold ramp — light-gold → #D4AF37 → deep-gold
                     * creates a specular-highlight illusion on a 3px line.
                     */
                    background:
                      "linear-gradient(to right, transparent 0%, rgba(245, 223, 130, 0.85) 30%, #D4AF37 55%, rgba(165, 130, 50, 0.9) 75%, transparent 100%)",
                    boxShadow:
                      "0 0 14px 3px rgba(212, 175, 55, 0.55), 0 0 6px 1px rgba(245, 223, 130, 0.45)",
                  }}
                />
              ) : (
                /* ── Determinate metallic-gold fill (streaming / done) ── */
                <motion.div
                  animate={{ width: `${Math.round(streamProgress * 100)}%` }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    height: "100%",
                    /*
                     * Three-stop metallic gold. The lighter stop near 50%
                     * creates the signature specular sheen of brushed gold.
                     */
                    background:
                      "linear-gradient(to right, rgba(165, 130, 50, 0.95) 0%, #D4AF37 45%, rgba(245, 223, 130, 0.95) 65%, #D4AF37 85%, rgba(165, 130, 50, 0.95) 100%)",
                    boxShadow:
                      "0 0 12px 2px rgba(212, 175, 55, 0.6), 0 0 4px 1px rgba(245, 223, 130, 0.5)",
                    borderRadius: "28px 28px 0 0",
                    minWidth: "4%",
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Article header ---- */}
        <div style={{ marginBottom: 8, paddingTop: 68 }}>
          <p
            style={{
              margin: 0,
              /*
               * Contrast fix: the old `rgba(0,162,157,0.65)` was a dark teal
               * on the #003334 background — barely readable. Surface (#f7fafa)
               * at 50% opacity gives a clean muted-but-legible secondary label
               * on the dark panel without using off-brand colours.
               */
              color: "rgba(247, 250, 250, 0.5)",
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: IBM_PLEX,
            }}
          >
            Mudrik · مُدْرِك
          </p>
        </div>

        <h1
          style={{
            margin: "8px 0 16px",
            paddingBottom: 10,
            borderBottom: "1px solid rgba(212, 175, 55, 0.25)",
            color: surface,
            /*
             * display-sm scale: clamp(1.875rem … 2.25rem) per the Mudrik
             * fluid type scale. 1.6 line-height prevents Arabic descenders
             * from touching the gold rule on the #003334 background.
             */
            fontSize: "clamp(1.875rem, 2.5vw, 2.25rem)",
            lineHeight: 1.6,
            fontWeight: 600,
            fontFamily: IBM_PLEX,
            direction: "rtl",
          }}
        >
          العرض الفني المباشر
        </h1>

        {/* ---- Action bar (analysis state only) ---- */}
        <AnimatePresence>
          {panelState === "analysis" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 14,
                flexWrap: "wrap",
                direction: "rtl",
              }}
            >
              {/* New generation button */}
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: "rgba(247,250,250,0.08)",
                  /* Contrast: text on dark panel must be Surface (#f7fafa), not alpha-teal */
                  color: surface,
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ← توليد جديد
              </button>

              {/* Export button — appears only when text is ready */}
              {!isGeneratingText && proposalText && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  onClick={handleExportWord}
                  disabled={exportState === "working"}
                  style={{
                    background: secondary,
                    color: "white",
                    border: "none",
                    borderRadius: 999,
                    padding: "8px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: exportState === "working" ? "wait" : "pointer",
                    opacity: exportState === "working" ? 0.7 : 1,
                    fontFamily: "inherit",
                    boxShadow: "0 8px 24px rgba(0,106,103,0.25)",
                  }}
                >
                  {exportState === "working" ? "جاري التصدير…" : "تصدير Word"}
                </motion.button>
              )}

              {/* Save to archive — appears when text is ready */}
              {!isGeneratingText && proposalText && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: EASE, delay: 0.08 }}
                  onClick={handleSaveToArchive}
                  disabled={archiveSaved}
                  style={{
                    background: archiveSaved
                      ? "rgba(212, 175, 55, 0.15)"
                      : "rgba(212, 175, 55, 0.18)",
                    color: archiveSaved ? "rgba(212,175,55,0.7)" : "#D4AF37",
                    border: "1px solid rgba(212,175,55,0.3)",
                    borderRadius: 999,
                    padding: "8px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: archiveSaved ? "default" : "pointer",
                    fontFamily: "inherit",
                    transition: "all 250ms ease",
                  }}
                >
                  {archiveSaved ? "✓ تم الحفظ" : "حفظ في الأرشيف"}
                </motion.button>
              )}

              {/* Error messages */}
              {(error || exportError) && (
                <span
                  style={{
                    color: "#fca5a5",
                    fontSize: 13,
                    fontWeight: 500,
                    alignSelf: "center",
                    direction: "rtl",
                  }}
                >
                  {error || exportError}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Streaming reader ---- */}
        <div
          ref={textContainerRef}
          onScroll={handleScroll}
          dir="rtl"
          lang="ar"
          aria-busy={isGeneratingText}
          style={{
            flex: 1,
            /*
             * IBM Plex Sans Arabic, weight 400 (body).
             * 18px / 1.9 line-height: comfortable scanning of long proposals
             * on the dark #003334 panel.
             */
            fontFamily: IBM_PLEX,
            fontWeight: 400,
            fontSize: 18,
            lineHeight: 1.9,
            whiteSpace: "normal",
            wordBreak: "break-word",
            textAlign: "inherit",
            direction: "rtl",
            unicodeBidi: "plaintext",
            color: "rgba(247, 250, 250, 0.88)",
            borderRadius: 16,
            padding: 20,
            background: "rgba(0, 0, 0, 0.14)",
            overflowY: "auto",
            scrollBehavior: "smooth",
            minHeight: 320,
            maxHeight: 520,
            boxShadow: "inset 0 2px 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          {proposalText ? (
            <div>
              {isGeneratingText ? (
                <div
                  dir="rtl"
                  lang="ar"
                  role="log"
                  aria-relevant="additions"
                  aria-live="polite"
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    textAlign: "justify",
                    unicodeBidi: "plaintext",
                  }}
                >
                  {streamingDisplay}
                  <span className="mudrik-caret" aria-hidden="true" />
                </div>
              ) : (
                <PremiumMarkdownViewer markdown={proposalText ?? ""} />
              )}
            </div>
          ) : isGeneratingText ? (
            /* ── Awaiting phase: elegant generation animation ── */
            <motion.div
              key="awaiting-animation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              aria-live="polite"
              aria-label="جاري توليد العرض الفني"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: 280,
                gap: 26,
                padding: "12px 0",
              }}
            >
              {/* Pulsing logo orb */}
              <div style={{ position: "relative", width: 68, height: 68 }}>
                {/* Outer halo */}
                <motion.div
                  animate={{ scale: [1, 1.28, 1], opacity: [0.12, 0.28, 0.12] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    inset: -14,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(212,175,55,0.42) 0%, transparent 68%)",
                  }}
                />
                {/* Inner ring */}
                <motion.div
                  animate={{ scale: [1, 1.14, 1], opacity: [0.25, 0.55, 0.25] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
                  style={{
                    position: "absolute",
                    inset: -3,
                    borderRadius: "50%",
                    border: "1.5px solid rgba(212,175,55,0.35)",
                  }}
                />
                {/* Badge */}
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    background: "rgba(247,250,250,0.07)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 0 28px rgba(212,175,55,0.14), inset 0 0 0 1px rgba(212,175,55,0.15)",
                  }}
                >
                  <MudrikLogo size={30} />
                </div>
              </div>

              {/* Skeleton text lines with gold shimmer sweep */}
              <div
                style={{
                  width: "100%",
                  maxWidth: 440,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  direction: "rtl",
                }}
              >
                {([1, 0.82, 0.94, 0.68, 0.88, 0.75] as const).map((w, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.08 + i * 0.08,
                      duration: 0.42,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      height: i === 0 ? 15 : 12,
                      borderRadius: 8,
                      width: `${w * 100}%`,
                      background: "rgba(247,250,250,0.07)",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* Gold shimmer wave */}
                    <motion.div
                      animate={{ x: ["110%", "-60%"] }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeInOut",
                        repeatDelay: 0.5,
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        width: "55%",
                        background:
                          "linear-gradient(to left, transparent 0%, rgba(212,175,55,0.15) 35%, rgba(212,175,55,0.3) 50%, rgba(212,175,55,0.15) 65%, transparent 100%)",
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Three pulsing gold dots + status label */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 11,
                }}
              >
                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  {[0, 0.22, 0.44].map((delay) => (
                    <motion.span
                      key={delay}
                      animate={{ scale: [1, 1.6, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.15,
                        repeat: Infinity,
                        delay,
                        ease: "easeInOut",
                      }}
                      style={{
                        display: "block",
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: gold,
                      }}
                    />
                  ))}
                </div>
                <motion.span
                  animate={{ opacity: [0.42, 0.78, 0.42] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    fontFamily: IBM_PLEX,
                    fontSize: 12,
                    fontWeight: 500,
                    color: surface,
                    direction: "rtl",
                    letterSpacing: "0.04em",
                  }}
                >
                  مُدرك يُعِدّ الصياغة الأولية للعرض الفني…
                </motion.span>
              </div>
            </motion.div>
          ) : (
            <span
              style={{
                direction: "rtl",
                display: "block",
                fontFamily: IBM_PLEX,
                fontWeight: 400,
                fontStyle: "normal",
                color: surface,
                opacity: 0.45,
              }}
            >
              سيظهر العرض الفني هنا فور بدء التوليد.
            </span>
          )}
        </div>

        {/* ================================================================
            COMMITTEE SIMULATOR — appears after proposal is fully generated
            Self-contained: laser scan + glassmorphism results.
            Placed inside the dark article so it reads on the dark surface.
            ================================================================ */}
        <CommitteeSimulator
          proposalText={proposalText}
          visible={panelState === "analysis" && !isGeneratingText && !!proposalText}
        />
      </article>

      {/* ================================================================
          BOTTOM — Morphing panel: INPUT_STATE ↔ ANALYSIS_STATE
          Full-width row below the dark reader.
          ================================================================ */}
      <div style={{ width: "100%" }}>
        {/*
         * `mode="wait"`: input exit must finish before Bento enter — no overlap cut.
         * `layoutId`: shared Framer element morph between the two white shells.
         */}
        <AnimatePresence mode="wait" initial={false}>
          {/* ============================================================
              INPUT STATE — Single form panel
              ============================================================ */}
          {panelState === "input" && (
            <motion.div
              key="input-panel"
              layoutId={BENTO_MORPH_LAYOUT_ID}
              layout
              style={bentoShellStyle}
              initial={{ opacity: 1 }}
              exit={{
                opacity: 0,
                y: 10,
                transition: { duration: 0.38, ease: EASE_IN_BACK },
              }}
            >
            <form
              onSubmit={handleGenerate}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                margin: 0,
                padding: 0,
                background: "transparent",
                border: "none",
                minHeight: 0,
              }}
            >
              {/* Eyebrow */}
              <p
                style={{
                  margin: 0,
                  color: secondary,
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  direction: "rtl",
                }}
              >
                محرك العطاءات الذكي
              </p>

              {/* Title with gold underline */}
              <h2
                style={{
                  margin: 0,
                  paddingBottom: 10,
                  borderBottom: `1px solid ${goldVeil}`,
                  color: primary,
                  fontSize: "clamp(1.1rem, 1.8vw, 1.35rem)",
                  lineHeight: 1.3,
                  fontWeight: 700,
                  direction: "rtl",
                }}
              >
                أدخل متطلبات المناقصة
              </h2>

              {/* 3-column metadata inputs */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  direction: "rtl",
                }}
              >
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="اسم المشروع"
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={ownerEntity}
                  onChange={(e) => setOwnerEntity(e.target.value)}
                  placeholder="الجهة المالكة"
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={executionDuration}
                  onChange={(e) => setExecutionDuration(e.target.value)}
                  placeholder="مدة التنفيذ"
                  style={inputStyle}
                />
              </div>

              {/* ---- File extraction zone ---- */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) void analyzeFile(f);
                }}
                onClick={() => document.getElementById("emerald-rfp-file")?.click()}
                style={{
                  borderRadius: 14,
                  padding: "12px 16px",
                  background: drag
                    ? "rgba(0, 106, 103, 0.12)"
                    : "rgba(0, 106, 103, 0.05)",
                  cursor: fileAnalyzing ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "background 220ms ease",
                  border: "1.5px dashed rgba(0, 106, 103, 0.25)",
                }}
              >
                <input
                  id="emerald-rfp-file"
                  type="file"
                  accept=".pdf,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void analyzeFile(f);
                  }}
                />
                {fileAnalyzing ? (
                  <Loader2 size={16} style={{ color: secondary, flexShrink: 0, animation: "spin 1s linear infinite" }} />
                ) : analyzedFilename ? (
                  <FileText size={16} style={{ color: secondary, flexShrink: 0 }} />
                ) : (
                  <FileSearch size={16} style={{ color: secondary, flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 12, color: fileError ? "#dc2626" : secondary, fontWeight: 600, direction: "rtl" }}>
                  {fileAnalyzing
                    ? "جارٍ استخراج النص…"
                    : fileError
                    ? fileError
                    : analyzedFilename
                    ? analyzedFilename
                    : "رفع PDF أو DOCX لاستخراج نص الكراسة"}
                </span>
              </div>

              {/* RFP textarea — fills remaining vertical space */}
              <textarea
                value={rfpText}
                onChange={(e) => setRfpText(e.target.value)}
                placeholder="الصق نص كراسة الشروط هنا، أو ارفع ملفاً أعلاه…"
                rows={10}
                style={{
                  ...inputStyle,
                  flex: 1,
                  resize: "none",
                  lineHeight: 1.75,
                  paddingTop: 12,
                }}
              />

              {/* Generate CTA — full width */}
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  borderRadius: 18,
                  border: "none",
                  background: canSubmit ? primary : "rgba(0,51,52,0.1)",
                  color: canSubmit ? surface : "rgba(0,51,52,0.35)",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                  direction: "rtl",
                  boxShadow: canSubmit ? "0 12px 32px rgba(0,51,52,0.22)" : "none",
                  transition: "background 200ms, box-shadow 200ms",
                }}
              >
                توليد العرض الفني الذكي
              </button>
            </form>
            </motion.div>
          )}

          {/* ============================================================
              ANALYSIS STATE — Three Bento cards
              ============================================================ */}
          {panelState === "analysis" && (
            <motion.div
              key="analysis-panel"
              layoutId={BENTO_MORPH_LAYOUT_ID}
              layout
              style={bentoShellStyle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.48, ease: EASE, delay: 0.02 }}
              exit={{
                opacity: 0,
                y: 12,
                scale: 0.99,
                transition: { duration: 0.42, ease: EASE_IN_BACK },
              }}
            >
              {/*
                Semantic bento: single column on small viewports; md+ two columns
                with the timeline card spanning the full width of the second row.
              */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {bentoCards.map((card) => (
                <motion.div
                  key={card.id}
                  role="region"
                  aria-labelledby={`bento-heading-${card.id}`}
                  data-bento-slot={card.id}
                  className={
                    card.id === "timeline"
                      ? "bento-luxury-card md:col-span-2"
                      : "bento-luxury-card"
                  }
                  initial={{ opacity: 0, y: 30, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.98, transition: { duration: 0.35, ease: BENTO_CASCADE_EASING } }}
                  transition={{
                    duration: BENTO_CASCADE_DURATION,
                    ease: BENTO_CASCADE_EASING,
                    delay: card.staggerEnterDelay,
                  }}
                  whileHover={{
                    background: "color-mix(in srgb, #f7fafa 98%, #ffffff 2%)",
                    boxShadow: "0 24px 60px rgba(0, 51, 52, 0.08)",
                    transition: { duration: 0.45, ease: BENTO_CASCADE_EASING },
                  }}
                  style={{
                    background: surface,
                    borderRadius: 22,
                    overflow: "hidden",
                    boxShadow:
                      "0 4px 50px rgba(0, 51, 52, 0.05), 0 1px 4px rgba(0, 51, 52, 0.02)",
                  }}
                >
                  <motion.div
                    animate={{
                      background: card.hasData
                        ? "rgba(0, 106, 103, 0.07)"
                        : "transparent",
                    }}
                    transition={{ duration: 0.5, ease: BENTO_CASCADE_EASING }}
                    style={{ padding: "14px 16px 10px", direction: "rtl" }}
                  >
                    <p
                      className="bento-card-eyebrow"
                      style={{
                        margin: 0,
                        color: secondary,
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      {card.label}
                    </p>
                    <h3
                      id={`bento-heading-${card.id}`}
                      style={{
                        margin: "4px 0 0",
                        color: secondary,
                        fontSize: "clamp(0.9rem, 1.5vw, 1.05rem)",
                        fontWeight: 600,
                        lineHeight: 1.35,
                        fontFamily: IBM_PLEX,
                      }}
                    >
                      {card.title}
                    </h3>
                    <div
                      className="bento-card-hairline"
                      aria-hidden
                      style={{
                        height: 1,
                        marginTop: 8,
                        borderRadius: 1,
                        background: "rgba(212, 175, 55, 0.2)",
                      }}
                    />
                  </motion.div>

                  <AnimatePresence mode="wait" initial={false}>
                    {card.ready ? (
                      <motion.div
                        key="data"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, ease: BENTO_CASCADE_EASING }}
                        style={{ color: tertiary }}
                      >
                        {card.visualizer}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="skeleton"
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: BENTO_CASCADE_EASING }}
                      >
                        <BoxSkeleton baseDelay={card.skeletonBaseDelay} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
