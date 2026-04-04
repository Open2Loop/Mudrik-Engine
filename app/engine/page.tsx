/**
 * @project MUDRIK - AI Tender Consultant
 * @author Al-Baraa | البراء
 * @created March 2026
 * @status Stable Version 1.0
 * @copyright (c) 2026 All Rights Reserved
 * @legal_notice This source code and all its algorithms are the sole property of Al-Baraa.
 * Any unauthorized copying, modification, or distribution is strictly prohibited.
 * مشروع مُدْرِك - مستشار المنافسات الذكي
 * حقوق الملكية محفوظة (ج) ٢٠٢٦ - المؤلف: البراء
 */

"use client";

import { Fragment, useState, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import {
  FileSearch,
  Sparkles,
  AlertCircle,
  FileText,
  Loader2,
  Wand2,
  Copy,
  Check,
} from "lucide-react";

/** Renders **bold** as <strong>; strips remaining stray * pairs for a clean formal look. */
function renderDraftRichText(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => (
    <Fragment key={lineIdx}>
      {lineIdx > 0 ? <br /> : null}
      {renderLineWithBold(line)}
    </Fragment>
  ));
}

function renderLineWithBold(line: string): ReactNode {
  const nodes: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) {
      nodes.push(
        <Fragment key={`t-${key++}`}>{stripLoneAsteriskEmphasis(line.slice(last, m.index))}</Fragment>
      );
    }
    nodes.push(
      <strong key={`b-${key++}`} className="font-semibold text-white">
        {m[1]}
      </strong>
    );
    last = m.index + m[0].length;
  }
  if (last < line.length) {
    nodes.push(
      <Fragment key={`t-${key++}`}>{stripLoneAsteriskEmphasis(line.slice(last))}</Fragment>
    );
  }
  return nodes.length > 0 ? nodes : stripLoneAsteriskEmphasis(line);
}

function stripLoneAsteriskEmphasis(segment: string): ReactNode {
  const parts = segment.split(/(\*[^*\n]+\*)/g);
  if (parts.length === 1) return segment.replace(/\*/g, "");
  return parts.map((part, i) => {
    const single = part.match(/^\*([^*\n]+)\*$/);
    if (single) return single[1];
    return part.replace(/\*/g, "");
  });
}

/** Plain text for Word/paste: no markdown asterisks or heading hashes. */
function stripMarkdownForClipboard(text: string): string {
  return text.replace(/[*#]/g, "");
}

export default function EnginePage() {
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState<"idle" | "analyze" | "generate" | "build">("idle");
  const [rfpText, setRfpText] = useState("");
  const [filename, setFilename] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; type: "error" | "info" } | null>(null);
  const [chunks, setChunks] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyDraftToClipboard() {
    if (!draft?.trim()) return;
    try {
      await navigator.clipboard.writeText(stripMarkdownForClipboard(draft));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setNotice({ message: "تعذر النسخ. تحقق من أذونات المتصفح.", type: "error" });
    }
  }

  async function analyzeFile(file: File) {
    setNotice(null);
    const acceptedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!acceptedTypes.includes(file.type)) {
      setNotice({ message: "يُقبل ملفات PDF أو DOCX فقط.", type: "error" });
      return;
    }
    setBusy("analyze");
    const fd = new FormData();
    fd.set("rfp", file);
    const res = await fetch("/api/engine/analyze", { method: "POST", body: fd });
    const data = (await res.json()) as { error?: string; text?: string; filename?: string };
    setBusy("idle");
    if (!res.ok) {
      setNotice({ message: data.error ?? "تعذر تحليل الملف.", type: "error" });
      return;
    }
    setRfpText(data.text ?? "");
    setFilename(data.filename ?? file.name);
    setDraft(null);
    setChunks(null);
  }

  async function runGenerate() {
    if (!rfpText.trim()) {
      setNotice({ message: "لا يوجد نص لكراسة الشروط. حمّل ملفاً أولاً.", type: "error" });
      return;
    }
    setBusy("generate");
    setNotice(null);
    const res = await fetch("/api/engine/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rfpText }),
    });
    setBusy("idle");
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setNotice({ message: data.error ?? "تعذر التوليد.", type: "error" });
      return;
    }
    const text = await res.text();
    setDraft(text.trim() || null);
    const header = res.headers.get("x-context-chunks-used");
    const used = header ? Number(header) : null;
    setChunks(Number.isFinite(used) ? used : null);
  }

  return (
    <AppShell title="محرك العطاءات الذكي">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <p className="text-base leading-relaxed text-mist mb-8">
              قم برفع كراسة الشروط (PDF) لاستخراج متطلبات المشروع، ثم دع الذكاء الاصطناعي يولد لك مسودة العرض الفني بناءً على خبراتكم السابقة.
            </p>

            <div
              className={`relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed transition-all duration-300 ${
                drag 
                  ? "border-midnight bg-midnight/5" 
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void analyzeFile(f);
              }}
              onClick={() => document.getElementById("engine-input")?.click()}
            >
              <input
                id="engine-input"
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void analyzeFile(f);
                }}
              />
              <div className="flex flex-col items-center text-center px-6">
                <div className={`mb-4 rounded-2xl p-4 transition-colors ${drag ? "bg-midnight text-white" : "bg-white text-midnight shadow-sm"}`}>
                  <FileSearch size={32} />
                </div>
                <span className="text-lg font-bold text-midnight">تحليل كراسة الشروط (PDF / DOCX)</span>
                <span className="mt-2 text-sm text-mist max-w-[280px]">
                  سيتم استخراج النص بالكامل وتجهيزه لعملية التوليد الذكي
                </span>
              </div>
            </div>

            {busy === "analyze" && (
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-midnight/5 px-5 py-4 border border-midnight/10 animate-pulse">
                <Loader2 size={18} className="animate-spin text-midnight" />
                <span className="text-sm font-bold text-midnight">جارٍ استخراج وتحليل النص…</span>
              </div>
            )}

            {filename && !busy && (
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 px-5 py-4 border border-slate-200">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <FileText size={16} className="text-midnight" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-mist font-bold">الملف النشط</span>
                  <span className="text-sm font-bold text-midnight">{filename}</span>
                </div>
              </div>
            )}

            <div className="mt-8 space-y-3">
              <label htmlFor="rfp" className="flex items-center gap-2 text-sm font-bold text-charcoal">
                <FileText size={16} className="text-mist" />
                محتوى الكراسة (المستخرج)
              </label>
              <textarea
                id="rfp"
                value={rfpText}
                onChange={(e) => setRfpText(e.target.value)}
                rows={12}
                className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 text-sm leading-relaxed text-charcoal outline-none focus:border-midnight/40 focus:ring-4 focus:ring-midnight/5 transition-all resize-none"
                placeholder="يظهر هنا النص المستخرج بعد التحميل، يمكنك تعديله قبل التوليد…"
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => void runGenerate()}
                disabled={busy !== "idle" || !rfpText.trim()}
                className="flex items-center gap-2 rounded-full bg-midnight px-8 py-4 text-sm font-bold text-white shadow-lg shadow-midnight/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
              >
                {busy === "generate" ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Wand2 size={18} />
                )}
                توليد المسودة الذكية
              </button>
            </div>

            {notice && (
              <div className={`mt-6 flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
                notice.type === "error" ? "bg-red-50 text-red-700 border border-red-100" : "bg-blue-50 text-blue-700 border border-blue-100"
              }`}>
                <AlertCircle size={18} />
                {notice.message}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-200">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles size={22} className="text-amber-400" />
              معاينة العرض المولد
            </h3>
            
            {!draft && busy === "idle" ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Wand2 size={48} className="mb-4" />
                <p className="text-sm font-medium">ابدأ بتوليد العرض لرؤية النتائج هنا</p>
              </div>
            ) : busy === "generate" ? (
              <div className="space-y-6 py-10">
                <div className="h-6 bg-white/10 rounded-full w-3/4 animate-pulse" />
                <div className="space-y-3">
                  <div className="h-4 bg-white/5 rounded-full w-full animate-pulse" />
                  <div className="h-4 bg-white/5 rounded-full w-full animate-pulse" />
                  <div className="h-4 bg-white/5 rounded-full w-2/3 animate-pulse" />
                </div>
              </div>
            ) : draft ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="relative rounded-2xl border border-white/10 bg-white/5 px-5 pb-6 pt-14">
                  <button
                    type="button"
                    onClick={() => void copyDraftToClipboard()}
                    className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15 active:scale-[0.98]"
                  >
                    {copied ? (
                      <>
                        <Check size={16} className="text-emerald-300" aria-hidden />
                        تم النسخ
                      </>
                    ) : (
                      <>
                        <Copy size={16} aria-hidden />
                        نسخ
                      </>
                    )}
                  </button>
                  <div
                    dir="rtl"
                    className="font-sans text-[15px] font-normal leading-relaxed text-slate-100 antialiased whitespace-pre-wrap"
                  >
                    {renderDraftRichText(draft)}
                  </div>
                </div>
                {typeof chunks === "number" && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-white/40 font-medium">المصادر المستخدمة من الخزنة</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">{chunks} مقاطع</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-midnight mb-6">كيف يعمل المحرك؟</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-midnight">١</div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-midnight">تحليل الكراسة</p>
                  <p className="text-xs text-mist leading-relaxed">نقوم باستخراج النصوص والجداول من ملف PDF بدقة عالية.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-midnight">٢</div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-midnight">البحث الذكي</p>
                  <p className="text-xs text-mist leading-relaxed">نبحث في &quot;الخزنة&quot; عن أفضل المقاطع التي تطابق متطلبات الكراسة.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-midnight">٣</div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-midnight">توليد المسودة</p>
                  <p className="text-xs text-mist leading-relaxed">نقوم بصياغة عرض فني احترافي يدمج متطلباتك مع خبراتك السابقة.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
