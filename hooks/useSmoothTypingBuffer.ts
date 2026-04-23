"use client";

import { useLayoutEffect, useEffect, useRef, useState } from "react";

/**
 * Reveals `targetText` with a high-speed, human-typing feel while `isStreaming`
 * is true. Incoming server chunks may arrive as large blocks; the display string
 * advances in small, rAF-timed steps so the eye reads steady motion, not
 * stuttering dumps. When streaming stops, the full target is shown immediately.
 */
export function useSmoothTypingBuffer(
  targetText: string,
  isStreaming: boolean,
): string {
  const [display, setDisplay] = useState("");
  const posRef = useRef(0);
  const targetRef = useRef(targetText);
  const rafRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    targetRef.current = targetText;
    if (targetText.length === 0) {
      posRef.current = 0;
      setDisplay("");
    }
  }, [targetText]);

  useLayoutEffect(() => {
    if (!isStreaming) {
      const t = targetRef.current;
      posRef.current = t.length;
      setDisplay(t);
    }
  }, [isStreaming, targetText]);

  useEffect(() => {
    if (!isStreaming) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const stepChars = (lag: number) =>
      Math.min(lag, Math.max(1, Math.min(48, Math.ceil(lag / 4))));

    const loop = () => {
      const t = targetRef.current;
      let p = posRef.current;
      if (p < t.length) {
        p = Math.min(p + stepChars(t.length - p), t.length);
        posRef.current = p;
        setDisplay(t.slice(0, p));
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isStreaming]);

  return display;
}
