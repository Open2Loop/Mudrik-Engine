"use client";

import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

const IBM_PLEX = "var(--font-ibm-plex), 'IBM Plex Sans Arabic', system-ui, sans-serif";

const LINE_COUNT = 12;
/** Long paper: larger on canvas for legibility */
const PAPER_W = 72;
const PAPER_H = 108;
const LINE_INSET = 9;

const PAPER_Y = 7;
const VB_W = 108;
const VB_H = PAPER_Y + PAPER_H + 12;
const PAPER_X = (VB_W - PAPER_W) / 2;

const LINE_X0 = PAPER_X + LINE_INSET;
const LINE_X1 = PAPER_X + PAPER_W - LINE_INSET;
const LINE_LEN = LINE_X1 - LINE_X0;
const GAP_TOP = 18;
const GAP_BOTTOM = 10;
const y0 = PAPER_Y + GAP_TOP;
const y1 = PAPER_Y + PAPER_H - GAP_BOTTOM;

const DESCRIPTION_AR =
  "تحليل ذكي يقيس مدى دقة مطابقة العرض الفني للمعايير المطلوبة، لضمان القبول والاحترافية.";

function lineProgress(
  w: number,
  isGenerating: boolean,
  hasResult: boolean,
  scanLine: number,
  scanT: number,
  i: number,
): number {
  if (isGenerating) {
    if (i < scanLine) return 1;
    if (i > scanLine) return 0;
    return scanT;
  }
  if (!hasResult) return 0;
  const fillAmount = (w / 100) * LINE_COUNT;
  return Math.min(1, Math.max(0, fillAmount - i));
}

export function ComplianceScore({
  value,
  active,
  label = "مؤشر مطابقة المعايير",
  isGenerating = false,
}: {
  value: number;
  active?: boolean;
  label?: string;
  isGenerating?: boolean;
}) {
  const w = Math.min(100, Math.max(0, value));
  const LINE_MS = 400;
  const CYCLE = LINE_COUNT * LINE_MS;
  const hasResult = w > 0.05;
  const [scan, setScan] = useState({ line: 0, t: 0 });
  const rafRef = useRef<number>(0);

  const laserY1 = PAPER_Y + 4;
  const laserY2 = PAPER_Y + PAPER_H - 12;

  useLayoutEffect(() => {
    if (isGenerating) {
      setScan({ line: 0, t: 0.12 });
    }
  }, [isGenerating]);

  useEffect(() => {
    if (!isGenerating) {
      setScan({ line: 0, t: 0 });
      return;
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - t0) % CYCLE;
      const line = Math.min(LINE_COUNT - 1, Math.floor(elapsed / LINE_MS));
      const t = (elapsed % LINE_MS) / LINE_MS;
      setScan({ line, t });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isGenerating, CYCLE, LINE_MS]);

  return (
    <div
      className="w-full max-w-full rounded-2xl border border-slate-200/95 bg-white px-0 py-5 shadow-[0_4px_24px_rgba(15,23,42,0.06),0_1px_0_rgba(255,255,255,1)_inset] sm:py-6"
      dir="rtl"
      style={{ fontFamily: IBM_PLEX, boxSizing: "border-box" }}
      role="group"
      aria-label={`${label} — ${w.toFixed(2)}٪`}
      aria-live={active || isGenerating ? "polite" : "off"}
    >
      <div className="flex w-full min-w-0 flex-col items-center gap-1">
        <p className="w-full text-center text-base font-bold text-emerald-800">{label}</p>
        <p className="mt-1 max-w-md px-2 text-center text-xs leading-relaxed text-slate-600 sm:px-0">
          {DESCRIPTION_AR}
        </p>

        <div className="mt-4 flex w-full min-w-0 flex-row items-center justify-center gap-4 sm:gap-7">
          <div className="flex shrink-0 items-center justify-center">
            <div
              className="relative h-[clamp(176px,40vw,272px)] w-auto shrink-0 drop-shadow-[0_8px_20px_rgba(15,118,110,0.12)]"
              style={{ aspectRatio: `${VB_W} / ${VB_H}` } as CSSProperties}
              dir="ltr"
              aria-hidden
            >
              <div
                className="absolute z-0 overflow-hidden rounded-[4px] border border-[#0f766e]/[0.35] bg-white"
                style={{
                  left: `${(PAPER_X / VB_W) * 100}%`,
                  top: `${(PAPER_Y / VB_H) * 100}%`,
                  width: `${(PAPER_W / VB_W) * 100}%`,
                  height: `${(PAPER_H / VB_H) * 100}%`,
                }}
              />
              <div
                className="pointer-events-none absolute z-[1] rounded-t-[2.5px] bg-gradient-to-r from-[#a7f3d0]/45 via-[#34d399]/88 to-[#10b981]/45"
                style={{
                  left: `${(PAPER_X / VB_W) * 100}%`,
                  top: `${(PAPER_Y / VB_H) * 100}%`,
                  width: `${(PAPER_W / VB_W) * 100}%`,
                  height: `${(12 / VB_H) * 100}%`,
                  opacity: 0.14,
                }}
              />
              <div
                className="absolute z-[2] flex min-h-0 w-full flex-col justify-between"
                style={{
                  left: `${(LINE_X0 / VB_W) * 100}%`,
                  top: `${(y0 / VB_H) * 100}%`,
                  width: `${(LINE_LEN / VB_W) * 100}%`,
                  height: `${((y1 - y0) / VB_H) * 100}%`,
                }}
              >
                {Array.from({ length: LINE_COUNT }, (_, i) => {
                  const p = lineProgress(w, isGenerating, hasResult, scan.line, scan.t, i);
                  return (
                    <div
                      key={i}
                      className="relative w-full min-h-[2.5px] flex-[0_0_auto] overflow-hidden rounded-full bg-white/10"
                    >
                      {p > 0 ? (
                        <div
                          className="absolute inset-y-0 start-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] [animation:pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]"
                          style={{ width: `${p * 100}%` }}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div
                className="pointer-events-none absolute z-[3] overflow-hidden rounded-[4px]"
                style={{
                  left: `${(PAPER_X / VB_W) * 100}%`,
                  top: `${(PAPER_Y / VB_H) * 100}%`,
                  width: `${(PAPER_W / VB_W) * 100}%`,
                  height: `${(PAPER_H / VB_H) * 100}%`,
                }}
              >
                {isGenerating ? (
                  <motion.div
                    className="absolute opacity-85 [filter:drop-shadow(0_0_12px_rgba(52,211,153,0.5))]"
                    style={{
                      left: `${(2 / PAPER_W) * 100}%`,
                      width: `${((PAPER_W - 4) / PAPER_W) * 100}%`,
                      height: `${(14 / PAPER_H) * 100}%`,
                      background:
                        "linear-gradient(to bottom, rgba(52,211,153,0), rgba(110,231,183,0.95) 40%, rgba(236,253,245,1) 50%, rgba(110,231,183,0.95) 60%, rgba(52,211,153,0))",
                    }}
                    initial={false}
                    animate={{
                      top: [
                        `${((laserY1 - PAPER_Y) / PAPER_H) * 100}%`,
                        `${((laserY2 - PAPER_Y) / PAPER_H) * 100}%`,
                        `${((laserY1 - PAPER_Y) / PAPER_H) * 100}%`,
                      ],
                    }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <motion.div
            className="flex shrink-0 flex-col items-center justify-center self-center"
            initial={false}
            animate={active ? { scale: [1, 1.01, 1] } : { scale: 1 }}
            transition={{ duration: 1.8, repeat: active ? Infinity : 0, ease: "easeInOut" }}
          >
            <p
              className="text-[clamp(2.25rem,5.8vw,3.25rem)] font-black tabular-nums leading-none tracking-tight text-emerald-900"
              style={{ fontFamily: IBM_PLEX }}
              aria-hidden
            >
              {w.toFixed(2)}٪
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
