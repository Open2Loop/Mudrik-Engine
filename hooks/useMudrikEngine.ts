"use client";

import { useCallback, useRef, useState } from "react";

export type {
  GapItem,
  GapSeverity,
  BoqItem,
  WbsItem,
  ExecutionState,
} from "@/lib/engine-types";

import type { GapItem, BoqItem, WbsItem } from "@/lib/engine-types";

export interface StartGenerationInput {
  projectName: string;
  ownerEntity: string;
  executionDuration: string;
  rfpText: string;
  companyDocs?: string | string[];
}

interface PostJsonOptions {
  endpoint: string;
  body: Record<string, unknown>;
  signal: AbortSignal;
}

/**
 * Lifecycle phase of the generation stream:
 *   idle      — no generation active
 *   awaiting  — request sent, Writer step running, no text yet (0 chars)
 *   streaming — QA step streaming, chars arriving
 *   done      — stream complete, text available
 */
export type StreamPhase = "idle" | "awaiting" | "streaming" | "done";

interface UseMudrikEngineResult {
  proposalText: string;
  gapsData: GapItem[];
  boqData: BoqItem[];
  wbsData: WbsItem[];
  isGeneratingText: boolean;
  isAnalyzingMetadata: boolean;
  /** 0–1 signal driven by streamed character count. Useful for progress UX. */
  streamProgress: number;
  /** Granular lifecycle phase for two-stage progress UI. */
  streamPhase: StreamPhase;
  /** Main proposal stream error only — not set by side-panel API failures. */
  error: string | null;
  /** Per-panel errors — only the relevant card shows its own error. */
  gapsError: string | null;
  boqError: string | null;
  wbsError: string | null;
  startGeneration: (input: StartGenerationInput) => Promise<void>;
  reset: () => void;
}

async function readResponseError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      details?: string;
      message?: string;
    } | null;
    return (
      payload?.error ??
      payload?.details ??
      payload?.message ??
      "حدث خطأ غير متوقع أثناء معالجة الطلب."
    );
  }

  const text = await response.text().catch(() => "");
  return text.trim() || "حدث خطأ غير متوقع أثناء معالجة الطلب.";
}

/** Unwraps `{ success, data }` or legacy `{ gaps|boq|wbs }` from side-panel API JSON. */
function unwrapSidePanelArray<T>(raw: unknown, legacyKey: "gaps" | "boq" | "wbs"): T[] {
  if (raw == null || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  if (o.success === false) return [];
  if (Array.isArray(o.data)) return o.data as T[];
  const legacy = o[legacyKey];
  if (Array.isArray(legacy)) return legacy as T[];
  return [];
}

const RETRYABLE_JSON = new Set([429, 500, 502, 503, 504]);

/**
 * Bento panel APIs (gaps → BOQ → WBS) always run in a single chain **after**
 * the main `/api/engine/generate` SSE stream has fully completed.
 *
 * They must never run concurrently with the proposal writer, or with each
 * other — this avoids Vercel Edge / route timeouts (502) from overlapping
 * long-running work.
 */
/** Short pause between chained side requests to avoid back-to-back cold spikes. */
const SIDE_ROUTE_STAGGER_MS = 180;

async function sleepMs(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

async function postJsonWithRetry<T>(
  options: PostJsonOptions,
  maxRetries = 2,
): Promise<T> {
  let attempt = 0;
  while (true) {
    const response = await fetch(options.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options.body),
      signal: options.signal,
    });

    if (response.ok) {
      return (await response.json()) as T;
    }

    if (!RETRYABLE_JSON.has(response.status) || attempt >= maxRetries) {
      throw new Error(await readResponseError(response));
    }

    attempt++;
    const wait = attempt * 2_000;
    console.warn(
      `[useMudrikEngine] ${options.endpoint} ${response.status}, retry ${attempt}/${maxRetries} in ${wait}ms`,
    );
    await new Promise<void>((r) => setTimeout(r, wait));
  }
}

/**
 * Parses a single SSE line from the Vercel AI SDK UI message stream.
 *
 * Stream format (AI SDK v5/v6 `toUIMessageStreamResponse`):
 *
 *   data: {"type":"start","messageId":"..."}
 *   data: {"type":"start-step"}
 *   data: {"type":"text-start","id":"text_a"}
 *   data: {"type":"text-delta","id":"text_a","delta":"مرحبا "}
 *   data: {"type":"text-delta","id":"text_a","delta":"بالعالم"}
 *   data: {"type":"text-end","id":"text_a"}
 *   data: {"type":"finish-step"}
 *   data: {"type":"finish"}
 *   data: [DONE]
 *
 * Only `text-delta` events carry visible text. Every other event type
 * (including `text-start` / `text-end` which merely bracket an id) MUST
 * return the empty string — otherwise the raw stream control frames leak
 * into the UI.
 *
 * If a line fails `JSON.parse` it is almost always a buffering race where
 * the boundary fell mid-line; we return "" rather than leaking the raw
 * fragment.
 */
function extractDeltaFromSseLine(line: string): string {
  if (!line.startsWith("data:")) return "";
  const payload = line.slice(5).trim();
  if (!payload || payload === "[DONE]") return "";

  let event: { type?: unknown; delta?: unknown; textDelta?: unknown };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    // Partial JSON from a chunk boundary — silently drop. Never leak raw data.
    return "";
  }

  if (event.type !== "text-delta") return "";

  const delta = typeof event.delta === "string" ? event.delta : event.textDelta;
  return typeof delta === "string" ? delta : "";
}

/**
 * Decodes a batch of SSE lines out of a multi-chunk stream buffer.
 *
 * Always buffers partial trailing lines; never returns a raw chunk verbatim
 * even when the chunk does not yet contain a `data:` prefix — that would
 * leak control bytes across network boundaries.
 */
function parseStreamChunk(rawChunk: string, bufferRef: { current: string }): string {
  const combined = bufferRef.current + rawChunk;
  const lines = combined.split(/\r?\n/);
  // Preserve the last (possibly partial) line for the next pass.
  bufferRef.current = lines.pop() ?? "";

  let extracted = "";
  for (const line of lines) {
    if (!line) continue;
    extracted += extractDeltaFromSseLine(line);
  }
  return extracted;
}

/**
 * Wraps `fetch` with up to `maxRetries` retries on transient 503 / 502 / 429
 * responses.  The AbortSignal is forwarded so user-initiated cancellation
 * still works immediately even mid-retry.
 *
 * Back-off: attempt × 2 000 ms (2 s, 4 s, …).
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2,
): Promise<Response> {
  const RETRYABLE = new Set([429, 502, 503, 504]);
  let attempt = 0;

  while (true) {
    const response = await fetch(url, options);
    if (!RETRYABLE.has(response.status) || attempt >= maxRetries) return response;
    attempt++;
    const wait = attempt * 2_000;
    console.warn(
      `[useMudrikEngine] stream ${response.status}, retrying (${attempt}/${maxRetries}) in ${wait}ms`,
    );
    await new Promise<void>((r) => setTimeout(r, wait));
  }
}

export function useMudrikEngine(): UseMudrikEngineResult {
  const [proposalText, setProposalText] = useState("");
  const [gapsData, setGapsData] = useState<GapItem[]>([]);
  const [boqData, setBoqData] = useState<BoqItem[]>([]);
  const [wbsData, setWbsData] = useState<WbsItem[]>([]);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isAnalyzingMetadata, setIsAnalyzingMetadata] = useState(false);
  const [streamedChars, setStreamedChars] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [gapsError, setGapsError] = useState<string | null>(null);
  const [boqError, setBoqError] = useState<string | null>(null);
  const [wbsError, setWbsError] = useState<string | null>(null);

  // A 15-page Arabic proposal is ~18 000–22 000 chars. 20 000 is a good midpoint.
  const TARGET_CHARS = 20_000;

  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  /** Coalesce rapid SSE chunks to one React update per animation frame. */
  const streamRafRef = useRef<number | null>(null);
  const streamPendingRef = useRef("");

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    requestIdRef.current += 1;
    setProposalText("");
    setGapsData([]);
    setBoqData([]);
    setWbsData([]);
    setIsGeneratingText(false);
    setIsAnalyzingMetadata(false);
    setStreamedChars(0);
    setError(null);
    setGapsError(null);
    setBoqError(null);
    setWbsError(null);
  }, []);

  const startGeneration = useCallback(async (input: StartGenerationInput) => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setError(null);
    setGapsError(null);
    setBoqError(null);
    setWbsError(null);
    setProposalText("");
    setGapsData([]);
    setBoqData([]);
    setWbsData([]);
    setStreamedChars(0);
    setIsGeneratingText(true);
    // Bento APIs start only after the stream ends; keep false until then.
    setIsAnalyzingMetadata(false);

    try {
      let accumulated = "";

      /** Bento chain: Gaps (Compliance) → BOQ (Resources) → WBS (Timeline). */
      const runSideSequential = async (proposalSnapshot: string) => {
        if (requestIdRef.current !== requestId || controller.signal.aborted) {
          return;
        }
        const technicalSource = proposalSnapshot.trim() || input.rfpText;
        if (!technicalSource.trim()) {
          return;
        }

        setIsAnalyzingMetadata(true);
        const signal = controller.signal;
        try {
          // 1) Compliance — analyze-gaps
          try {
            // eslint-disable-next-line no-console
            console.log("🟡 [2/4] Fetching Compliance/Gaps…");
            const gapsPayload = await postJsonWithRetry<Record<string, unknown>>({
              endpoint: "/api/engine/analyze-gaps",
              body: { proposalText: technicalSource, rfpText: input.rfpText },
              signal,
            });
            if (requestIdRef.current === requestId) {
              setGapsData(unwrapSidePanelArray<GapItem>(gapsPayload, "gaps"));
              // eslint-disable-next-line no-console
              console.log("✅ Gaps Success");
            }
          } catch (e) {
            if (e instanceof Error && (e as Error).name === "AbortError") return;
            if (requestIdRef.current === requestId) {
              setGapsData([]);
              setGapsError("تعذر تحليل البيانات - حاول مرة أخرى.");
            }
            // eslint-disable-next-line no-console
            console.error("🔴 Gaps Failed", e);
          }

          if (requestIdRef.current !== requestId || signal.aborted) {
            return;
          }

          try {
            await sleepMs(SIDE_ROUTE_STAGGER_MS, signal);
          } catch {
            return;
          }

          // 2) Resources — estimate-boq
          try {
            // eslint-disable-next-line no-console
            console.log("🟡 [3/4] Fetching BoQ/Resources…");
            const boqPayload = await postJsonWithRetry<Record<string, unknown>>({
              endpoint: "/api/engine/estimate-boq",
              body: { proposalText: technicalSource },
              signal,
            });
            if (requestIdRef.current === requestId) {
              setBoqData(unwrapSidePanelArray<BoqItem>(boqPayload, "boq"));
              // eslint-disable-next-line no-console
              console.log("✅ BoQ Success");
            }
          } catch (e) {
            if (e instanceof Error && (e as Error).name === "AbortError") return;
            if (requestIdRef.current === requestId) {
              setBoqData([]);
              setBoqError("تعذر تحليل البيانات - حاول مرة أخرى.");
            }
            // eslint-disable-next-line no-console
            console.error("🔴 BoQ Failed", e);
          }

          if (requestIdRef.current !== requestId || signal.aborted) {
            return;
          }

          try {
            await sleepMs(SIDE_ROUTE_STAGGER_MS, signal);
          } catch {
            return;
          }

          // 3) Timeline — generate-wbs
          try {
            // eslint-disable-next-line no-console
            console.log("🟡 [4/4] Fetching WBS/Timeline…");
            const wbsPayload = await postJsonWithRetry<Record<string, unknown>>({
              endpoint: "/api/engine/generate-wbs",
              body: {
                proposalText: technicalSource,
                executionDuration: input.executionDuration,
              },
              signal,
            });
            if (requestIdRef.current === requestId) {
              setWbsData(unwrapSidePanelArray<WbsItem>(wbsPayload, "wbs"));
              // eslint-disable-next-line no-console
              console.log("✅ WBS Success");
            }
          } catch (e) {
            if (e instanceof Error && (e as Error).name === "AbortError") return;
            if (requestIdRef.current === requestId) {
              setWbsData([]);
              setWbsError("تعذر تحليل البيانات - حاول مرة أخرى.");
            }
            // eslint-disable-next-line no-console
            console.error("🔴 WBS Failed", e);
          }
        } finally {
          if (requestIdRef.current === requestId) {
            setIsAnalyzingMetadata(false);
          }
        }
      };

      const response = await fetchWithRetry(
        "/api/engine/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rfpText: input.rfpText,
            companyDocs: input.companyDocs ?? "",
            projectName: input.projectName,
            ownerEntity: input.ownerEntity,
            executionDuration: input.executionDuration,
          }),
          signal: controller.signal,
        },
        2,
      );

      if (!response.ok || !response.body) {
        throw new Error(await readResponseError(response));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const sseBuffer = { current: "" };

      const flushStreamFrame = () => {
        streamRafRef.current = null;
        const text = streamPendingRef.current;
        if (requestIdRef.current === requestId) {
          setStreamedChars(text.length);
          setProposalText(text);
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const delta = parseStreamChunk(chunk, sseBuffer);
          if (!delta) continue;

          accumulated += delta;
          streamPendingRef.current = accumulated;
          if (requestIdRef.current === requestId) {
            if (streamRafRef.current == null) {
              streamRafRef.current = requestAnimationFrame(flushStreamFrame);
            }
          }
        }

        if (streamRafRef.current != null) {
          cancelAnimationFrame(streamRafRef.current);
          streamRafRef.current = null;
        }

        const tail = parseStreamChunk("\n", sseBuffer);
        if (tail) {
          accumulated += tail;
          streamPendingRef.current = accumulated;
        }
        if (requestIdRef.current === requestId) {
          setStreamedChars(accumulated.length);
          setProposalText(accumulated);
        }
      } finally {
        if (streamRafRef.current != null) {
          cancelAnimationFrame(streamRafRef.current);
          streamRafRef.current = null;
        }
        if (requestIdRef.current === requestId) {
          setIsGeneratingText(false);
        }
      }

      if (requestIdRef.current !== requestId || controller.signal.aborted) {
        return;
      }

      // Sequential bento chain only after proposal stream is 100% complete:
      // analyze-gaps → estimate-boq → generate-wbs (never parallel to /generate).
      // eslint-disable-next-line no-console
      console.log("🟢 [1/4] Main Proposal Stream Completed.");
      await runSideSequential(accumulated);
    } catch (caughtError) {
      if (controller.signal.aborted) return;
      const message =
        caughtError instanceof Error ? caughtError.message : "تعذر إكمال التوليد. حاول مرة أخرى.";
      if (requestIdRef.current === requestId) {
        setError((prev) => (prev ? `${prev} | ${message}` : message));
        setIsGeneratingText(false);
        setIsAnalyzingMetadata(false);
      }
    }
  }, []);

  const streamPhase: StreamPhase = isGeneratingText
    ? streamedChars === 0
      ? "awaiting"   // Writer running — no bytes yet
      : "streaming"  // QA streaming — chars arriving
    : proposalText.length > 0
    ? "done"
    : "idle";

  // During the awaiting phase there are no chars yet, so we report 0.
  // During streaming we cap at 0.92 to avoid reaching 100% before the
  // server actually signals completion.
  const streamProgress =
    streamPhase === "streaming"
      ? Math.min(0.92, streamedChars / TARGET_CHARS)
      : streamPhase === "done"
      ? 1
      : 0;

  return {
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
  };
}
