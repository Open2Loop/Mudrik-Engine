/**
 * @project MUDRIK - AI Tender Consultant
 * الأرشيف — saved technical proposals (Supabase table from `PROPOSALS_TABLE` / `NEXT_PUBLIC_SUPABASE_PROPOSALS_TABLE`).
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PremiumMarkdownViewer } from "@/components/EmeraldUI/PremiumMarkdownViewer";
import { createClient } from "@/lib/supabase/client";
import { ensureAnonymousSession } from "@/lib/supabase/ensure-anonymous-session";
import { PROPOSALS_TABLE } from "@/lib/supabase/proposals-table";
import { Archive, Loader2, Search, X } from "lucide-react";

type ProposalRow = {
  id: string;
  content: string;
  compliance_score: number | null;
  created_at: string;
  project_name: string | null;
  metadata: Record<string, unknown> | null;
};

function formatArchiveCardDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortDateForTitle(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

/** Prominent label: DB `project_name` first, then legacy metadata, then date fallback. */
function proposalTitle(row: ProposalRow): string {
  const col = row.project_name?.trim();
  if (col) return col;
  const m = row.metadata;
  if (m && typeof m === "object" && "projectName" in m) {
    const n = m.projectName;
    if (typeof n === "string" && n.trim()) return n.trim();
  }
  return `عرض فني — ${shortDateForTitle(row.created_at)}`;
}

function scoreLabel(score: number | null): { text: string; className: string } {
  if (score == null || Number.isNaN(score)) {
    return { text: "—", className: "text-mist/70 bg-white/80" };
  }
  const rounded = Math.min(100, Math.max(0, Math.round(score)));
  const high = rounded > 80;
  return {
    text: `${rounded}٪`,
    className: high
      ? "bg-secondary/10 text-secondary ring-1 ring-secondary/30"
      : "bg-tertiary/[0.06] text-primary ring-1 ring-ghost",
  };
}

const EMPTY_STATE_AR =
  "لا توجد عروض فنية محفوظة في الأرشيف حالياً." as const;

export default function ArchivePage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [detail, setDetail] = useState<ProposalRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const user = await ensureAnonymousSession(supabase);
      const uid = user?.id;
      if (!uid) {
        setRows([]);
        return;
      }
      const { data, error } = await supabase
        .from(PROPOSALS_TABLE)
        .select("id, content, compliance_score, created_at, project_name, metadata")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      if (error) {
        setRows([]);
        return;
      }
      setRows((data ?? []) as ProposalRow[]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const title = proposalTitle(row).toLowerCase();
      const pn = (row.project_name ?? "").toLowerCase();
      const dateStr = formatArchiveCardDate(row.created_at).toLowerCase();
      const scoreStr =
        row.compliance_score != null && !Number.isNaN(row.compliance_score)
          ? String(Math.round(row.compliance_score))
          : "";
      return (
        title.includes(q) ||
        pn.includes(q) ||
        dateStr.includes(q) ||
        scoreStr.includes(q)
      );
    });
  }, [rows, searchQuery]);

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetail(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [detail]);

  return (
    <AppShell title="الأرشيف">
      <div className="mx-auto w-full max-w-3xl space-y-8 pb-8">
        <p className="text-[clamp(0.88rem,0.82rem+0.25vw,1rem)] leading-relaxed text-mist/90">
          استعرض العروض الفنية التي حفظتها. استخدم البحث للوصول السريع.
        </p>

        <div className="relative">
          <label htmlFor="archive-search" className="sr-only">
            البحث في العروض المحفوظة
          </label>
          <Search
            className="pointer-events-none absolute end-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mist/45"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            id="archive-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث في العروض المحفوظة..."
            className="w-full rounded-2xl border border-ghost bg-white py-3.5 pe-12 ps-5 text-right text-primary shadow-sm shadow-primary/[0.04] placeholder:text-mist/45 transition focus:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/20"
            dir="rtl"
            autoComplete="off"
          />
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-mist">
            <Loader2 className="h-9 w-9 animate-spin text-secondary" aria-hidden />
            <span className="text-sm font-medium">جارٍ التحميل…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-[min(55vh,520px)] flex-col items-center justify-center gap-4 px-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary/8 text-secondary/90 ring-1 ring-secondary/15">
              <Archive size={36} strokeWidth={1.25} aria-hidden />
            </div>
            <p className="max-w-md text-lg font-semibold leading-relaxed text-primary">
              {EMPTY_STATE_AR}
            </p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex min-h-[32vh] flex-col items-center justify-center gap-2 px-4 text-center text-mist">
            <p className="text-base font-medium text-primary/85">
              لا نتائج تطابق البحث.
            </p>
            <p className="text-sm text-mist/80">جرّب كلمات أخرى أو امسح حقل البحث.</p>
          </div>
        ) : (
          <ul className="space-y-3" role="list">
            {filteredRows.map((row) => {
              const badge = scoreLabel(row.compliance_score);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setDetail(row)}
                    className="group w-full rounded-2xl border border-ghost/80 bg-white p-5 text-right shadow-sm shadow-primary/[0.03] transition hover:border-secondary/35 hover:shadow-md hover:shadow-primary/[0.06]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-secondary/90">
                          المشروع
                        </p>
                        <h2 className="text-lg font-extrabold leading-snug text-primary [text-wrap:balance] sm:text-xl">
                          {proposalTitle(row)}
                        </h2>
                        <p className="text-sm text-mist/75">
                          {formatArchiveCardDate(row.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center justify-end sm:justify-center">
                        <span
                          className={`inline-flex min-w-[4.5rem] items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-bold tabular-nums ${badge.className}`}
                          title="مؤشر الامتثال"
                        >
                          {badge.text}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {detail ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal
          aria-labelledby="archive-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-primary/50 backdrop-blur-sm"
            aria-label="إغلاق"
            onClick={() => setDetail(null)}
          />
          <div className="relative z-[101] flex max-h-[min(90vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-ghost bg-surface text-primary shadow-2xl shadow-primary/20">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-ghost bg-white/60 px-6 py-4 backdrop-blur-sm">
              <h2
                id="archive-modal-title"
                className="min-w-0 text-lg font-extrabold [text-wrap:balance] sm:text-xl"
              >
                {proposalTitle(detail)}
              </h2>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-full p-2 text-mist transition hover:bg-secondary/8 hover:text-primary"
                aria-label="إغلاق"
              >
                <X size={22} />
              </button>
            </div>
            <div dir="rtl" className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
              <div className="prose-p:leading-relaxed">
                <PremiumMarkdownViewer markdown={detail.content} />
              </div>
            </div>
            <div className="shrink-0 border-t border-ghost bg-white/40 px-6 py-3 text-center text-xs text-mist/70">
              إن كان النص دون تنسيق Markdown، سيُعرض كفقرات بسيطة.
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
