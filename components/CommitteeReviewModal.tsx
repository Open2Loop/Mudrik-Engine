"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  FileSearch,
  Loader2,
  Scale,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { COMMITTEE_AGENTS, type CommitteeSuggestion } from "@/lib/committee-types";

type CommitteeAgentId = (typeof COMMITTEE_AGENTS)[number]["id"];

type AgentSlotState = {
  loading: boolean;
  error: string | null;
  suggestions: CommitteeSuggestion[];
};

function emptyAgentSlots(): Record<CommitteeAgentId, AgentSlotState> {
  return {
    legal: { loading: false, error: null, suggestions: [] },
    technical: { loading: false, error: null, suggestions: [] },
    financial: { loading: false, error: null, suggestions: [] },
  };
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** ZWJ/ZWNJ/BOM + NBSP/narrow NBSP — common causes of "not found" despite visible match */
function stripInvisibles(s: string): string {
  return s.replace(/\u200c|\u200d|\ufeff/g, "").replace(/[\u00a0\u202f]/g, " ");
}

/**
 * First occurrence of `find` in `source` where runs of whitespace in `find` match any whitespace in `source`.
 * Returns exact [start, end) in `source` so replacement preserves surrounding formatting.
 */
function findFlexibleWhitespaceSpan(source: string, find: string): { start: number; end: number } | null {
  const t = find.trim();
  if (!t) return null;
  const tokens = t.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;
  if (tokens.length === 1 && tokens[0].length < 3) return null;
  const between = "[\\s\\u00a0\\u202f\\u200c\\u200d]*";
  const pattern = tokens.map((tok) => escapeRegex(stripInvisibles(tok))).join(between);
  try {
    const re = new RegExp(pattern, "u");
    const m = re.exec(source);
    if (!m) return null;
    return { start: m.index, end: m.index + m[0].length };
  } catch {
    return null;
  }
}

function applySmartReplace(
  source: string,
  find: string,
  replace: string,
): { next: string; ok: boolean } {
  if (!find.trim()) return { next: source, ok: false };

  const attempts: { i: number; len: number }[] = [];

  let i = source.indexOf(find);
  if (i !== -1) attempts.push({ i, len: find.length });

  const lf = find.replace(/\r\n/g, "\n");
  if (lf !== find) {
    i = source.indexOf(lf);
    if (i !== -1) attempts.push({ i, len: lf.length });
  }
  const crlf = find.replace(/\n/g, "\r\n");
  if (crlf !== find && crlf !== lf) {
    i = source.indexOf(crlf);
    if (i !== -1) attempts.push({ i, len: crlf.length });
  }

  const findStripped = stripInvisibles(find);
  if (findStripped !== find) {
    i = source.indexOf(findStripped);
    if (i !== -1) attempts.push({ i, len: findStripped.length });
  }

  for (let scan = 0; scan <= source.length - find.length; scan++) {
    if (stripInvisibles(source.slice(scan, scan + find.length)) === findStripped) {
      attempts.push({ i: scan, len: find.length });
      break;
    }
  }

  const flex = findFlexibleWhitespaceSpan(source, find);
  if (flex) attempts.push({ i: flex.start, len: flex.end - flex.start });

  if (attempts.length === 0) return { next: source, ok: false };
  const hit = attempts[0];
  return {
    next: source.slice(0, hit.i) + replace + source.slice(hit.i + hit.len),
    ok: true,
  };
}

const agentIcon = (id: (typeof COMMITTEE_AGENTS)[number]["id"]) => {
  if (id === "legal") return Scale;
  if (id === "technical") return Building2;
  return Wallet;
};

export function CommitteeReviewModal({
  open,
  onClose,
  proposalText,
  onProposalTextChange,
}: {
  open: boolean;
  onClose: () => void;
  proposalText: string;
  onProposalTextChange: (next: string) => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  const [localProposal, setLocalProposal] = useState(proposalText);
  const [agentSlots, setAgentSlots] = useState<Record<CommitteeAgentId, AgentSlotState>>(emptyAgentSlots);
  const [applyError, setApplyError] = useState<string | null>(null);
  const proposalTextRef = useRef(proposalText);
  const abortControllersRef = useRef<AbortController[]>([]);

  proposalTextRef.current = proposalText;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    abortControllersRef.current.forEach((c) => c.abort());
    abortControllersRef.current = [];

    if (!open) {
      setAgentSlots(emptyAgentSlots());
      return;
    }

    const snapshot = proposalTextRef.current;
    setLocalProposal(snapshot);
    setActiveAgentIndex(0);
    setApplyError(null);

    const trimmed = snapshot.trim();
    if (!trimmed) {
      setAgentSlots(emptyAgentSlots());
      return;
    }

    setAgentSlots({
      legal: { loading: true, error: null, suggestions: [] },
      technical: { loading: true, error: null, suggestions: [] },
      financial: { loading: true, error: null, suggestions: [] },
    });

    COMMITTEE_AGENTS.forEach((agent) => {
      const ac = new AbortController();
      abortControllersRef.current.push(ac);

      (async () => {
        try {
          const res = await fetch("/api/agents/committee", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ proposalText: snapshot, agentId: agent.id }),
            signal: ac.signal,
          });
          const data = (await res.json().catch(() => ({}))) as {
            success?: boolean;
            suggestions?: CommitteeSuggestion[];
            error?: string;
          };
          if (ac.signal.aborted) return;
          if (!res.ok) {
            setAgentSlots((p) => ({
              ...p,
              [agent.id]: {
                loading: false,
                error: `تعذر الاتصال بمركز اللجنة. ${String(data.error ?? res.statusText)}`.trim(),
                suggestions: [],
              },
            }));
            return;
          }
          if (data.error && data.success === false) {
            setAgentSlots((p) => ({
              ...p,
              [agent.id]: { loading: false, error: String(data.error), suggestions: [] },
            }));
            return;
          }
          const raw = data.suggestions ?? [];
          setAgentSlots((p) => ({
            ...p,
            [agent.id]: {
              loading: false,
              error: null,
              suggestions: raw.map((s) => ({
                ...s,
                id: crypto.randomUUID(),
                status: "pending" as const,
              })),
            },
          }));
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return;
          setAgentSlots((p) => ({
            ...p,
            [agent.id]: {
              loading: false,
              error: "حدث خطأ أثناء طلب الملاحظات.",
              suggestions: [],
            },
          }));
        }
      })();
    });

    return () => {
      abortControllersRef.current.forEach((c) => c.abort());
      abortControllersRef.current = [];
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const activeAgent = COMMITTEE_AGENTS[activeAgentIndex] ?? COMMITTEE_AGENTS[0];
  const activeSlot = agentSlots[activeAgent.id];
  const filtered = activeSlot.suggestions.filter((s) => s.agentName.trim() === activeAgent.name);
  const chatIntro = {
    legal: "ملخص المسار القانوني: العقود، العقوبات، والالتزامات التعاقدية حسب الظاهر في النص.",
    technical: "نظرة فنية: المنهج، المواصفات، والجدوى التنفيذية وما يرتبط بالمخرجات التقنية.",
    financial: "رقابة مالية: منطق التسعير، وتوزيع الموارد، وملاءمة الأرقام المذكورة.",
  }[activeAgent.id] as string;

  const onAccept = useCallback(
    (s: CommitteeSuggestion) => {
      setApplyError(null);
      if (!s.originalText.trim()) {
        setApplyError("لا يوجد نص أصلي للاستبدال — تخطي هذه البطاقة.");
        return;
      }
      let { next, ok } = applySmartReplace(localProposal, s.originalText, s.suggestedText);
      if (!ok && proposalText !== localProposal) {
        ({ next, ok } = applySmartReplace(proposalText, s.originalText, s.suggestedText));
      }
      if (!ok) {
        setApplyError("لم يُعثر على المقطع في النسخة الحالية (ربما اختلف اقتباس النموذج قليلاً أو تغيّر العرض). انسخ التعديل يدوياً.");
        return;
      }
      setLocalProposal(next);
      onProposalTextChange(next);
      const agentKey = COMMITTEE_AGENTS.find((a) => a.name === s.agentName.trim())?.id;
      if (!agentKey) return;
      setAgentSlots((prev) => ({
        ...prev,
        [agentKey]: {
          ...prev[agentKey],
          suggestions: prev[agentKey].suggestions.map((x) =>
            x.id === s.id ? { ...x, status: "accepted" as const } : x,
          ),
        },
      }));
    },
    [localProposal, proposalText, onProposalTextChange],
  );

  const onSkip = useCallback((s: CommitteeSuggestion) => {
    setApplyError(null);
    const agentKey = COMMITTEE_AGENTS.find((a) => a.name === s.agentName.trim())?.id;
    if (!agentKey) return;
    setAgentSlots((prev) => ({
      ...prev,
      [agentKey]: {
        ...prev[agentKey],
        suggestions: prev[agentKey].suggestions.map((x) =>
          x.id === s.id ? { ...x, status: "skipped" as const } : x,
        ),
      },
    }));
  }, []);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[240] flex items-center justify-center p-3 sm:p-5"
          style={{ fontFamily: "var(--font-ibm-plex), system-ui, sans-serif" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-[#001a1b]/60 backdrop-blur-sm"
            aria-hidden
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="relative z-10 flex h-[min(90vh,820px)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.4rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]"
            style={{
              background:
                "linear-gradient(150deg, rgba(0,51,52,0.94) 0%, rgba(8,32,40,0.9) 45%, rgba(0,30,32,0.95) 100%)",
              backdropFilter: "blur(22px)",
            }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-400/25 to-secondary/20 ring-1 ring-amber-500/20">
                  <FileSearch className="h-5 w-5 text-amber-200" aria-hidden />
                </div>
                <div>
                  <h2 id={titleId} className="text-lg font-bold text-[#f7fafa]">
                    لجنة الفحص
                  </h2>
                  <p className="text-xs text-white/50">حوكمة الخبراء تدقيقٌ شمولي يضبط الجوانب الفنية والمالية والاشتراطات النظامية</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-white/50 transition hover:bg-white/5 hover:text-white"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              <aside className="flex gap-1 border-b border-white/10 p-2 md:w-[208px] md:flex-col md:border-b-0 md:border-e md:border-e-white/10">
                {COMMITTEE_AGENTS.map((a, i) => {
                  const Icon = agentIcon(a.id);
                  const sel = i === activeAgentIndex;
                  const slot = agentSlots[a.id];
                  const slotBusy = slot.loading;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setActiveAgentIndex(i)}
                      className="flex min-w-0 flex-1 flex-col items-stretch gap-0.5 rounded-2xl px-3 py-2.5 text-right transition md:flex-row md:items-center md:gap-3"
                      style={{
                        background: sel ? a.color : "rgba(255,255,255,0.04)",
                        boxShadow: sel ? "0 0 0 1px rgba(255,255,255,0.1)" : undefined,
                      }}
                    >
                      <div className="flex items-center justify-center gap-2 md:gap-3">
                        <div
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                          style={{ background: "rgba(0,0,0,0.2)" }}
                        >
                          {slotBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin text-amber-300/90" aria-hidden />
                          ) : (
                            <Icon className="h-4 w-4 text-white/90" aria-hidden />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-right">
                          <div className="text-[12px] font-bold leading-tight text-white">
                            {a.name}
                          </div>
                          <div className="hidden text-[9px] text-white/45 md:line-clamp-2">
                            {a.subtitle}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </aside>

              <section className="flex min-h-0 flex-1 flex-col">
                <div className="shrink-0 border-b border-white/5 bg-black/20 px-5 py-3">
                  <p className="text-xs leading-relaxed text-white/60">{chatIntro}</p>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
                  {!proposalText.trim() && (
                    <p className="text-center text-sm text-white/50">لا يوجد نص عرض لمراجعته.</p>
                  )}

                  {!!proposalText.trim() && activeSlot.loading && (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/60">
                      <Loader2 className="h-9 w-9 animate-spin text-amber-400/80" />
                      <span className="text-sm font-medium">تُراجع لجنة الفحص المستند…</span>
                    </div>
                  )}

                  {!!proposalText.trim() && !activeSlot.loading && activeSlot.error && (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {activeSlot.error}
                    </div>
                  )}

                  {!!proposalText.trim() &&
                    !activeSlot.loading &&
                    !activeSlot.error &&
                    !activeSlot.suggestions.length && (
                      <p className="text-center text-sm text-white/45">لم تُستخرج ملاحظات من النموذج في هذه الجولة.</p>
                    )}

                  {!!proposalText.trim() && !activeSlot.loading && applyError && (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-100">
                      {applyError}
                    </div>
                  )}

                  {!!proposalText.trim() &&
                    !activeSlot.loading &&
                    !activeSlot.error &&
                    activeSlot.suggestions.length > 0 &&
                    !filtered.length && (
                      <p className="text-center text-sm text-white/45">
                        لا توجد ملاحظات من هذا المستشار في هذه الجولة.
                      </p>
                    )}

                  {!activeSlot.loading &&
                    !activeSlot.error &&
                    filtered.map((s) => (
                    <article
                      key={s.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-inner"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                          {s.section}
                        </span>
                        {s.status !== "pending" && (
                          <span
                            className="text-[10px] text-white/50"
                            style={{ fontStyle: s.status === "accepted" ? "normal" : "italic" }}
                          >
                            {s.status === "accepted" ? "مُنفَّذ" : "مُتخطّى"}
                          </span>
                        )}
                      </div>
                      <p className="mb-3 text-sm leading-relaxed text-white/85">{s.issue}</p>
                      <div className="mb-3 space-y-2 text-xs">
                        <div>
                          <span className="text-white/40">النص الأصلي</span>
                          <div className="mt-1 rounded-lg bg-black/30 p-2 text-white/75 whitespace-pre-wrap">
                            {s.originalText || "—"}
                          </div>
                        </div>
                        <div>
                          <span className="text-white/40">المقترح</span>
                          <div className="mt-1 rounded-lg border border-secondary/20 bg-secondary/5 p-2 text-white/90 whitespace-pre-wrap">
                            {s.suggestedText}
                          </div>
                        </div>
                      </div>
                      {s.status === "pending" && (
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onAccept(s)}
                            className="rounded-full bg-gradient-to-l from-[#0d4a4a] to-secondary px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition hover:brightness-110"
                          >
                            ✓ قبول
                          </button>
                          <button
                            type="button"
                            onClick={() => onSkip(s)}
                            className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/10"
                          >
                            ⏭ تخطي
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
