"use client";

/**
 * CommitteeSimulator — محاكي لجان الفحص الاعتمادية
 *
 * Three-phase experience:
 *   1. IDLE     — glowing gold CTA button
 *   2. SCANNING — laser sweep animation with cycling status labels
 *   3. COMPLETE — Glassmorphism results panel with 3 key metrics
 *
 * Design contract: Quiet Luxury × Government Security Clearance.
 * No external deps beyond framer-motion (already installed).
 */

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { AlertTriangle, CheckCircle2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { CommitteeSimResult } from "@/app/api/engine/simulate-committee/route";

// ---------------------------------------------------------------------------
//  Tokens (identical to EmeraldDashboard so no token drift)
// ---------------------------------------------------------------------------
const surface = "#f7fafa";
const primary = "#003334";
const secondary = "#006a67";
const gold = "#D4AF37";
const goldVeil = "rgba(212,175,55,0.18)";
const IBM_PLEX =
  "var(--font-ibm-plex), 'IBM Plex Sans Arabic', system-ui, sans-serif";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ---------------------------------------------------------------------------
//  Scanning status labels — cycle during the 3-second sweep
// ---------------------------------------------------------------------------
const SCAN_LABELS = [
  "جارٍ استيراد العرض الفني إلى بيئة المحاكاة...",
  "جارٍ تحليل البنية التقنية والمنهجية...",
  "جارٍ مقارنة المتطلبات مع قاعدة بيانات اللجان الحكومية...",
  "جارٍ استخراج مؤشرات التسعير التنافسي...",
  "جارٍ احتساب احتمالية الفوز بالمناقصة...",
  "اكتملت عملية المحاكاة بنجاح ✓",
];
const SCAN_DURATION_MS = 3200;
const LABEL_INTERVAL_MS = SCAN_DURATION_MS / SCAN_LABELS.length;

// ---------------------------------------------------------------------------
//  Circular progress ring
// ---------------------------------------------------------------------------
function WinProbabilityRing({
  value,
  size = 148,
}: {
  value: number;
  size?: number;
}) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const label =
    value >= 80 ? "مرتفع جداً" : value >= 70 ? "مرتفع" : "متوسط";
  const labelColor =
    value >= 80 ? secondary : value >= 70 ? "#4ade80" : gold;

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      {/* Outer ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -16,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(0,106,103,0.22) 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden
      >
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={secondary} />
            <stop offset="60%" stopColor="#00c4bb" />
            <stop offset="100%" stopColor={gold} stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Track ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,106,103,0.12)"
          strokeWidth={strokeWidth}
        />

        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: EASE, delay: 0.25 }}
          style={{ filter: "drop-shadow(0 0 9px rgba(0,106,103,0.75))" }}
        />
      </svg>

      {/* Center content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.5, ease: EASE }}
          style={{
            fontSize: 38,
            fontWeight: 800,
            color: surface,
            lineHeight: 1,
            fontFamily: IBM_PLEX,
          }}
        >
          {value}
          <span style={{ fontSize: 18, fontWeight: 600, opacity: 0.75 }}>%</span>
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.4 }}
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: labelColor,
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </motion.span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Laser scan visualization
// ---------------------------------------------------------------------------
function ScanVisualization({ labelIndex }: { labelIndex: number }) {
  const LINE_COUNT = 9;
  const LINE_WIDTHS = [0.88, 0.7, 0.95, 0.62, 0.82, 0.74, 0.9, 0.55, 0.78];

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        background: "rgba(0,0,0,0.35)",
        padding: "20px 22px",
        minHeight: 210,
        border: "1px solid rgba(212,175,55,0.14)",
      }}
    >
      {/* Corner crosshair brackets */}
      {(["topRight", "topLeft", "bottomRight", "bottomLeft"] as const).map((corner) => {
        const isTop = corner.startsWith("top");
        const isRight = corner.endsWith("Right");
        return (
          <div
            key={corner}
            aria-hidden
            style={{
              position: "absolute",
              top: isTop ? 8 : undefined,
              bottom: isTop ? undefined : 8,
              right: isRight ? 8 : undefined,
              left: isRight ? undefined : 8,
              width: 14,
              height: 14,
              borderTop: isTop ? `2px solid ${gold}` : "none",
              borderBottom: isTop ? "none" : `2px solid ${gold}`,
              borderRight: isRight ? `2px solid ${gold}` : "none",
              borderLeft: isRight ? "none" : `2px solid ${gold}`,
              opacity: 0.7,
            }}
          />
        );
      })}

      {/* Document skeleton lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {LINE_WIDTHS.map((w, i) => (
          <div
            key={i}
            style={{
              height: 9,
              borderRadius: 5,
              width: `${w * 100}%`,
              background: "rgba(247,250,250,0.08)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Subtle shimmer on each line */}
            <motion.div
              animate={{ x: ["110%", "-60%"] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: i * 0.18,
                ease: "easeInOut",
                repeatDelay: 0.4,
              }}
              style={{
                position: "absolute",
                inset: 0,
                width: "55%",
                background:
                  "linear-gradient(to left, transparent, rgba(247,250,250,0.06), transparent)",
              }}
            />
          </div>
        ))}
      </div>

      {/* THE LASER LINE — sweeps top to bottom */}
      <motion.div
        aria-hidden
        animate={{ y: ["-8%", "108%"] }}
        transition={{
          duration: SCAN_DURATION_MS / 1000 - 0.4,
          ease: "linear",
          repeat: 0,
        }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 2,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {/* Core beam */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background: `linear-gradient(to right,
              transparent 0%,
              rgba(0,196,187,0.4) 10%,
              rgba(212,175,55,0.9) 35%,
              rgba(255,240,140,1) 50%,
              rgba(212,175,55,0.9) 65%,
              rgba(0,196,187,0.4) 90%,
              transparent 100%)`,
            boxShadow: `
              0 0 6px 2px rgba(212,175,55,0.55),
              0 0 16px 4px rgba(212,175,55,0.3),
              0 0 40px 8px rgba(0,106,103,0.2)
            `,
          }}
        />
        {/* Halo glow above/below the beam */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: -8,
            height: 18,
            background:
              "linear-gradient(to bottom, transparent, rgba(212,175,55,0.08), transparent)",
            pointerEvents: "none",
          }}
        />
      </motion.div>

      {/* "SCANNING" badge overlay */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: "50%",
          transform: "translateX(50%)",
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 10px",
          borderRadius: 99,
          background: "rgba(212,175,55,0.1)",
          border: "1px solid rgba(212,175,55,0.25)",
          zIndex: 20,
        }}
      >
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: gold,
            display: "block",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.14em",
            color: gold,
            textTransform: "uppercase",
          }}
        >
          Scanning
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Result metric cards
// ---------------------------------------------------------------------------
function MetricCard({
  delay,
  children,
}: {
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.75, ease: EASE, delay }}
      style={{
        background:
          "linear-gradient(135deg, rgba(247,250,250,0.06) 0%, rgba(0,106,103,0.09) 100%)",
        backdropFilter: "blur(18px) saturate(160%)",
        WebkitBackdropFilter: "blur(18px) saturate(160%)",
        borderRadius: 20,
        padding: "22px 24px",
        border: "1px solid rgba(212,175,55,0.12)",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(247,250,250,0.06)",
      }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
//  Vulnerability type → icon + accent colour
// ---------------------------------------------------------------------------
const VULN_MAP = {
  timeline: { color: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
  compliance: { color: "#f87171", bg: "rgba(248,113,113,0.08)" },
  risk: { color: "#fb923c", bg: "rgba(251,146,60,0.08)" },
  volume: { color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
  technical: { color: "#38bdf8", bg: "rgba(56,189,248,0.08)" },
} as const;

// ---------------------------------------------------------------------------
//  Main component
// ---------------------------------------------------------------------------
interface CommitteeSimulatorProps {
  proposalText: string;
  visible: boolean;
}

type SimPhase = "idle" | "scanning" | "complete";

export default function CommitteeSimulator({
  proposalText,
  visible,
}: CommitteeSimulatorProps) {
  const [phase, setPhase] = useState<SimPhase>("idle");
  const [scanLabelIdx, setScanLabelIdx] = useState(0);
  const [result, setResult] = useState<CommitteeSimResult | null>(null);
  const labelTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when proposalText changes (new generation)
  useEffect(() => {
    setPhase("idle");
    setResult(null);
    setScanLabelIdx(0);
  }, [proposalText]);

  const startScan = useCallback(async () => {
    if (phase !== "idle" || !proposalText.trim()) return;

    setPhase("scanning");
    setScanLabelIdx(0);

    // Cycle status labels every LABEL_INTERVAL_MS
    let idx = 0;
    labelTimerRef.current = setInterval(() => {
      idx = Math.min(idx + 1, SCAN_LABELS.length - 1);
      setScanLabelIdx(idx);
    }, LABEL_INTERVAL_MS);

    // Kick off API call concurrently with the animation
    const apiPromise = fetch("/api/engine/simulate-committee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalText }),
    })
      .then((r) => r.json() as Promise<CommitteeSimResult>)
      .catch(() => null);

    // Minimum scan duration for the theatrical effect
    const minDelay = new Promise<void>((r) => setTimeout(r, SCAN_DURATION_MS + 200));

    const [simResult] = await Promise.all([apiPromise, minDelay]);

    if (labelTimerRef.current) clearInterval(labelTimerRef.current);

    setResult(simResult);
    setPhase("complete");
  }, [phase, proposalText]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (labelTimerRef.current) clearInterval(labelTimerRef.current);
    },
    [],
  );

  if (!visible) return null;

  const vuln = result
    ? VULN_MAP[result.vulnerabilityType] ?? VULN_MAP.timeline
    : VULN_MAP.timeline;

  return (
    <AnimatePresence mode="wait">
      {/* ================================================================
          IDLE — premium gold trigger button
          ================================================================ */}
      {phase === "idle" && (
        <motion.div
          key="idle"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 12,
            direction: "rtl",
          }}
        >
          <div style={{ position: "relative" }}>
            {/* Pulsing ambient glow behind the button */}
            <motion.div
              aria-hidden
              animate={{
                boxShadow: [
                  `0 0 0 0 rgba(212,175,55,0)`,
                  `0 0 0 18px rgba(212,175,55,0.12)`,
                  `0 0 0 0 rgba(212,175,55,0)`,
                ],
              }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                pointerEvents: "none",
              }}
            />

            <motion.button
              type="button"
              onClick={startScan}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.22, ease: EASE }}
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "13px 28px",
                borderRadius: 999,
                border: "1px solid rgba(212,175,55,0.45)",
                background: `linear-gradient(135deg,
                  rgba(212,175,55,0.12) 0%,
                  rgba(212,175,55,0.22) 50%,
                  rgba(212,175,55,0.10) 100%)`,
                color: gold,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: IBM_PLEX,
                letterSpacing: "0.03em",
                boxShadow: `
                  0 0 20px rgba(212,175,55,0.18),
                  inset 0 1px 0 rgba(255,255,255,0.06)
                `,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              {/* Shimmer sweep */}
              <motion.span
                aria-hidden
                animate={{ x: ["-120%", "220%"] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  repeatDelay: 1.6,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "40%",
                  background:
                    "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)",
                  pointerEvents: "none",
                  borderRadius: 999,
                }}
              />

              <ShieldCheck
                size={16}
                style={{ color: gold, flexShrink: 0 }}
              />
              <span>تفعيل محاكي لجان الفحص</span>
              <Sparkles
                size={14}
                style={{ color: gold, opacity: 0.8, flexShrink: 0 }}
              />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ================================================================
          SCANNING phase
          ================================================================ */}
      {phase === "scanning" && (
        <motion.div
          key="scanning"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18, scale: 0.97 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{
            direction: "rtl",
            fontFamily: IBM_PLEX,
            marginTop: 14,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <ShieldCheck size={15} style={{ color: gold, flexShrink: 0 }} />
            <span
              style={{
                color: gold,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              محاكاة لجنة الفحص الاعتمادية
            </span>
          </div>

          <ScanVisualization labelIndex={scanLabelIdx} />

          {/* Progress bar */}
          <div
            style={{
              marginTop: 14,
              height: 3,
              borderRadius: 2,
              background: "rgba(247,250,250,0.07)",
              overflow: "hidden",
            }}
          >
            <motion.div
              animate={{ width: "100%" }}
              initial={{ width: "0%" }}
              transition={{ duration: SCAN_DURATION_MS / 1000, ease: "linear" }}
              style={{
                height: "100%",
                background: `linear-gradient(to right, ${secondary}, ${gold})`,
                borderRadius: 2,
                boxShadow: `0 0 8px rgba(212,175,55,0.5)`,
              }}
            />
          </div>

          {/* Cycling status label */}
          <AnimatePresence mode="wait">
            <motion.p
              key={scanLabelIdx}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{
                margin: "10px 0 0",
                fontSize: 11,
                color: "rgba(247,250,250,0.5)",
                fontWeight: 500,
                textAlign: "right",
              }}
            >
              {SCAN_LABELS[scanLabelIdx]}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      )}

      {/* ================================================================
          COMPLETE — results panel
          ================================================================ */}
      {phase === "complete" && result && (
        <motion.div
          key="complete"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          style={{
            direction: "rtl",
            fontFamily: IBM_PLEX,
            marginTop: 14,
          }}
        >
          {/* Results header */}
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <CheckCircle2 size={15} style={{ color: secondary }} />
              <span
                style={{
                  color: surface,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  opacity: 0.9,
                }}
              >
                نتائج محاكاة لجنة الفحص
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPhase("idle")}
              style={{
                background: "rgba(247,250,250,0.06)",
                color: "rgba(247,250,250,0.45)",
                border: "none",
                borderRadius: 99,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: IBM_PLEX,
              }}
            >
              ← إعادة المحاكاة
            </button>
          </motion.div>

          {/* 3-metric grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {/* ── Card 1: Win probability ── */}
            <MetricCard delay={0.15}>
              <p
                style={{
                  margin: "0 0 4px",
                  color: secondary,
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Win Probability
              </p>
              <p
                style={{
                  margin: "0 0 20px",
                  color: surface,
                  fontWeight: 700,
                  fontSize: 14,
                  lineHeight: 1.3,
                }}
              >
                مؤشر احتمالية الفوز
              </p>

              <WinProbabilityRing value={result.score} />

              {/* Strengths pills */}
              {result.strengths.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.5 }}
                  style={{
                    marginTop: 16,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    justifyContent: "center",
                  }}
                >
                  {result.strengths.map((s) => (
                    <span
                      key={s}
                      style={{
                        padding: "3px 10px",
                        borderRadius: 99,
                        background: "rgba(0,106,103,0.15)",
                        color: secondary,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                      }}
                    >
                      ✓ {s}
                    </span>
                  ))}
                </motion.div>
              )}
            </MetricCard>

            {/* ── Card 2: Pricing intelligence ── */}
            <MetricCard delay={0.35}>
              <p
                style={{
                  margin: "0 0 4px",
                  color: gold,
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  opacity: 0.75,
                }}
              >
                Pricing Intelligence
              </p>
              <p
                style={{
                  margin: "0 0 22px",
                  color: surface,
                  fontWeight: 700,
                  fontSize: 14,
                  lineHeight: 1.3,
                }}
              >
                نطاق التسعير التنافسي
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                  direction: "rtl",
                }}
              >
                <TrendingUp size={16} style={{ color: gold, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "rgba(247,250,250,0.4)", fontWeight: 500 }}>
                  النطاق الأمثل للمنافسة
                </span>
              </div>

              {/* Range display */}
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: 14,
                  padding: "14px 16px",
                  textAlign: "center",
                  marginBottom: 14,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5, ease: EASE }}
                  style={{
                    fontSize: "clamp(1rem, 2vw, 1.25rem)",
                    fontWeight: 800,
                    color: surface,
                    lineHeight: 1.4,
                    direction: "rtl",
                  }}
                >
                  {result.pricingMin}
                  <span
                    style={{
                      display: "inline-block",
                      margin: "0 10px",
                      color: gold,
                      fontSize: "0.7em",
                      fontWeight: 400,
                      opacity: 0.7,
                    }}
                  >
                    ←
                  </span>
                  {result.pricingMax}
                </motion.div>
              </div>

              {/* Range bar */}
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "rgba(247,250,250,0.07)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Sweet-spot zone */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 1, ease: EASE }}
                  style={{
                    transformOrigin: "right",
                    position: "absolute",
                    right: "15%",
                    left: "15%",
                    top: 0,
                    bottom: 0,
                    background: `linear-gradient(to right, ${secondary}, ${gold})`,
                    boxShadow: `0 0 8px rgba(212,175,55,0.45)`,
                  }}
                />
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.4 }}
                style={{
                  margin: "8px 0 0",
                  fontSize: 10,
                  color: "rgba(247,250,250,0.35)",
                  fontWeight: 500,
                  textAlign: "center",
                }}
              >
                {result.confidence === "high"
                  ? "دقة التوقع عالية"
                  : result.confidence === "medium"
                  ? "دقة التوقع متوسطة"
                  : "دقة التوقع منخفضة"}
                {" · "}مبني على تحليل قاعدة بيانات اللجان
              </motion.p>
            </MetricCard>

            {/* ── Card 3: Critical vulnerability ── */}
            <MetricCard delay={0.55}>
              <p
                style={{
                  margin: "0 0 4px",
                  color: vuln.color,
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  opacity: 0.8,
                }}
              >
                Critical Vulnerability
              </p>
              <p
                style={{
                  margin: "0 0 20px",
                  color: surface,
                  fontWeight: 700,
                  fontSize: 14,
                  lineHeight: 1.3,
                }}
              >
                ثغرة محتملة
              </p>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75, duration: 0.55, ease: EASE }}
                style={{
                  background: vuln.bg,
                  border: `1px solid ${vuln.color}28`,
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  direction: "rtl",
                }}
              >
                <AlertTriangle
                  size={16}
                  style={{ color: vuln.color, flexShrink: 0, marginTop: 2 }}
                />
                <p
                  dir="rtl"
                  style={{
                    margin: 0,
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: "rgba(247,250,250,0.82)",
                    fontWeight: 500,
                  }}
                >
                  {result.vulnerability}
                </p>
              </motion.div>

              {/* Recommendation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                style={{ marginTop: 14 }}
              >
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 10,
                    color: "rgba(247,250,250,0.3)",
                    fontWeight: 700,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  التوصية
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "rgba(247,250,250,0.55)",
                    lineHeight: 1.7,
                    fontWeight: 400,
                  }}
                  dir="rtl"
                >
                  استخدم أداة &quot;إعادة التوليد&quot; لتعزيز هذا المحور قبل تقديم العرض
                  النهائي على منصة اعتماد.
                </p>
              </motion.div>
            </MetricCard>
          </div>

          {/* Disclaimer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            style={{
              margin: "14px 0 0",
              fontSize: 10,
              color: "rgba(247,250,250,0.2)",
              textAlign: "center",
              direction: "rtl",
            }}
          >
            المحاكاة للاسترشاد فقط · النتائج مبنية على نماذج تحليلية ولا تُمثل قرار
            أي لجنة حكومية فعلية
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
