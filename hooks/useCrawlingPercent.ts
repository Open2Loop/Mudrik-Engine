"use client";

import { useEffect, useRef, useState } from "react";

const MIN_FINAL = 84;
const MAX_FINAL = 97;

/**
 * Final % in [84, 97] derived from a per-run key (stable for the same run).
 */
export function drawFinalComplianceScore(runKey: string): number {
  let h = 0;
  for (let i = 0; i < runKey.length; i++) {
    h = (h * 31 + runKey.charCodeAt(i)) | 0;
  }
  const u = (Math.abs(h) % 10_000) / 10_000;
  return MIN_FINAL + u * (MAX_FINAL - MIN_FINAL);
}

const MILESTONES: { s: number; p: number }[] = [
  { s: 0, p: 0 },
  { s: 1400, p: 0.16 },
  { s: 2600, p: 0.16 },
  { s: 5200, p: 0.38 },
  { s: 6400, p: 0.38 },
  { s: 11000, p: 0.58 },
  { s: 12400, p: 0.58 },
  { s: 22000, p: 0.78 },
  { s: 24800, p: 0.78 },
  { s: 45000, p: 0.94 },
];

/**
 * As streamed text grows, target % moves from 0 toward `finalScore` with plateaus
 * (simulated "analysis" pauses) and a long tail.
 */
export function charCountToTargetPercent(charCount: number, finalScore: number): number {
  if (finalScore <= 0) return 0;
  if (charCount <= 0) return 0;

  let p = 0;
  if (charCount >= MILESTONES[MILESTONES.length - 1].s) {
    const last = MILESTONES[MILESTONES.length - 1];
    const tail = 1 - Math.exp(-(charCount - last.s) / 42_000);
    p = last.p + (0.97 - last.p) * tail;
  } else {
    for (let i = 0; i < MILESTONES.length - 1; i++) {
      const a = MILESTONES[i];
      const b = MILESTONES[i + 1];
      if (charCount <= b.s) {
        if (a.p === b.p) {
          p = a.p;
        } else {
          const t = (charCount - a.s) / (b.s - a.s);
          p = a.p + (b.p - a.p) * t;
        }
        break;
      }
    }
  }

  p = Math.min(0.97, Math.max(0, p));
  return finalScore * p;
}

type Phase = "idle" | "streaming" | "done" | "error";

/**
 * Smoothly animated percentage (two decimals) that only increases while streaming; settles in [84, 97] at end.
 */
export function useCrawlingPercent(
  phase: Phase,
  charCount: number,
  finalScore: number,
  runId: number,
): number {
  const [display, setDisplay] = useState(0);
  const targetRef = useRef(0);
  const displayRef = useRef(0);
  const lastRunIdRef = useRef(runId);

  useEffect(() => {
    if (lastRunIdRef.current === runId) return;
    lastRunIdRef.current = runId;
    targetRef.current = 0;
    displayRef.current = 0;
    setDisplay(0);
  }, [runId]);

  useEffect(() => {
    if (phase === "idle" || phase === "error") {
      targetRef.current = 0;
      displayRef.current = 0;
      setDisplay(0);
      return;
    }
    const raw = phase === "done" ? finalScore : charCountToTargetPercent(charCount, finalScore);
    const clamped = Math.min(100, Math.max(0, raw));
    if (clamped < targetRef.current) return;
    targetRef.current = clamped;
  }, [phase, charCount, finalScore]);

  useEffect(() => {
    if (phase === "idle" || phase === "error") {
      return;
    }
    let raf: number;
    const loop = () => {
      const target = targetRef.current;
      const d = displayRef.current;
      if (d < target - 0.0005) {
        const next = d + (target - d) * 0.1;
        displayRef.current = next;
        setDisplay(next);
      } else if (d !== target) {
        displayRef.current = target;
        setDisplay(target);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, runId]);

  return display;
}
