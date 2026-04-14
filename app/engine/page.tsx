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

/**
 * Engine UI: POST /api/engine/generate — توليد تتابعي للمجلدات الفنية + تعقيم نصي.
 */

import { useEffect, useRef, useState } from "react";
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
  Download,
} from "lucide-react";

const RFP_TEXT_SEND_CAP = 24_000;

/** Plain text for Word/paste — المخرجات مُعقّمة من الخادم؛ إزالة أي بقايا شكلية. */
function stripMarkdownForClipboard(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/`/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/(?<!\*)\*(?!\*)/g, "");
}

/** Strips ```json ... ``` or ``` ... ``` wrappers so JSON.parse / display succeeds. */
function stripMarkdownCodeFence(raw: string): string {
  const t = raw.replace(/\r\n/g, "\n").trim();
  const fenced = t.match(/```(?:json|text|markdown)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  return t;
}

function parseJsonErrorPayload(raw: string): {
  error?: string;
  code?: string;
  details?: string;
  failedSection?: number;
  partialSections?: string[];
} | null {
  const cleaned = stripMarkdownCodeFence(raw);
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned) as {
      error?: string;
      code?: string;
      details?: string;
      failedSection?: number;
      partialSections?: string[];
    };
  } catch {
    return null;
  }
}

/** Appends login hint when the API rejected the request as unauthenticated. */
function withAuthHint(res: Response, parsed: ReturnType<typeof parseJsonErrorPayload>, baseMsg: string): string {
  if (res.status === 401 || parsed?.code === "UNAUTHORIZED") {
    return `${baseMsg} إن لم تكن مسجّلاً للدخول، افتح صفحة تسجيل الدخول ثم أعد المحاولة.`;
  }
  return baseMsg;
}

export default function EnginePage() {
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState<"idle" | "analyze" | "generate" | "build">("idle");
  const [projectName, setProjectName] = useState("");
  const [ownerEntity, setOwnerEntity] = useState("");
  const [executionDuration, setExecutionDuration] = useState("");
  const [rfpText, setRfpText] = useState("");
  const [filename, setFilename] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [partialSections, setPartialSections] = useState<string[] | null>(null);
  const [failedSection, setFailedSection] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ message: string; type: "error" | "info" } | null>(null);
  const [chunks, setChunks] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  /** Simulated progress 0–100 while /api/engine/generate runs (no streaming; UX only). */
  const [generateProgress, setGenerateProgress] = useState(0);
  const generateProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const generateProgressStartRef = useRef<number>(0);

  function clearGenerateProgressTimer() {
    if (generateProgressTimerRef.current) {
      clearInterval(generateProgressTimerRef.current);
      generateProgressTimerRef.current = null;
    }
  }

  function startGenerateProgressSimulation() {
    clearGenerateProgressTimer();
    setGenerateProgress(0);
    generateProgressStartRef.current = Date.now();
    generateProgressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - generateProgressStartRef.current;
      const asymptotic = 92 * (1 - Math.exp(-elapsed / 95_000));
      setGenerateProgress(Math.min(92, asymptotic));
    }, 280);
  }

  useEffect(() => {
    return () => {
      clearGenerateProgressTimer();
    };
  }, []);

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

  async function exportDraftAsDocx() {
    if (!draft?.trim() || exportingDocx) return;
    setExportingDocx(true);
    setNotice(null);
    try {
      const res = await fetch("/api/engine/export-docx", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectName.trim() || "عرض فني — مُدرك",
          body: draft,
        }),
      });
      if (!res.ok) {
        const raw = await res.text();
        let msg = "تعذر تصدير ملف Word.";
        try {
          const j = JSON.parse(raw) as { error?: string };
          if (j?.error && String(j.error).trim()) msg = String(j.error).trim();
        } catch {
          if (raw.trim()) msg = raw.trim().slice(0, 400);
        }
        setNotice({ message: msg, type: "error" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dispo = res.headers.get("Content-Disposition");
      let downloadName = `mudrik-proposal-${Date.now()}.docx`;
      const m = dispo?.match(/filename\*=UTF-8''([^;\n]+)/i);
      if (m?.[1]) {
        try {
          downloadName = decodeURIComponent(m[1]);
        } catch {
          /* keep default */
        }
      }
      a.download = downloadName;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setNotice({ message: "تعذر تنزيل الملف. تحقق من الشبكة وأعد المحاولة.", type: "error" });
    } finally {
      setExportingDocx(false);
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
    try {
      const fd = new FormData();
      fd.set("rfp", file);
      const res = await fetch("/api/engine/analyze", {
        method: "POST",
        credentials: "same-origin",
        body: fd,
      });
      const raw = await res.text();
      if (!res.ok) {
        const parsed = parseJsonErrorPayload(raw);
        const msg =
          (parsed?.error && String(parsed.error).trim()) ||
          (raw.trim() ? raw.trim().slice(0, 500) : "تعذر تحليل الملف.");
        setNotice({ message: withAuthHint(res, parsed, msg), type: "error" });
        return;
      }
      let data: { text?: string; filename?: string };
      try {
        data = JSON.parse(stripMarkdownCodeFence(raw)) as { text?: string; filename?: string };
      } catch {
        setNotice({ message: "استجابة غير صالحة من خادم التحليل.", type: "error" });
        return;
      }
      setRfpText(data.text ?? "");
      setFilename(data.filename ?? file.name);
      setDraft(null);
      setChunks(null);
    } catch {
      setNotice({ message: "تعذر الاتصال بخادم التحليل. تحقق من الشبكة وأعد المحاولة.", type: "error" });
    } finally {
      setBusy("idle");
    }
  }

  async function runGenerate(mode: "fresh" | "resume" = "fresh") {
    let completedSuccessfully = false;
    setBusy("generate");
    setNotice(null);
    startGenerateProgressSimulation();
    try {
      const normalizedRfp = rfpText.trim();
      const rfpForRequest =
        normalizedRfp.length > RFP_TEXT_SEND_CAP
          ? normalizedRfp.slice(0, RFP_TEXT_SEND_CAP)
          : normalizedRfp;

      const payload: {
        projectName: string;
        ownerEntity: string;
        executionDuration: string;
        // Keep legacy key to avoid null/undefined in older handlers.
        rfpText?: string;
        resumeFromSection?: number;
        previousSections?: string[];
      } = {
        projectName: projectName.trim(),
        ownerEntity: ownerEntity.trim(),
        executionDuration: executionDuration.trim(),
        rfpText: rfpForRequest || undefined,
      };
      if (mode === "resume" && failedSection !== null && partialSections && partialSections.length > 0) {
        payload.resumeFromSection = failedSection;
        payload.previousSections = partialSections;
      } else {
        setPartialSections(null);
        setFailedSection(null);
      }
      const res = await fetch("/api/engine/generate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const raw = await res.text();
        const parsed = parseJsonErrorPayload(raw);
        let baseMsg =
          (parsed?.error && String(parsed.error).trim()) ||
          (raw.trim() ? raw.trim().slice(0, 500) : "تعذر التوليد.");
        const detail = parsed?.details ? String(parsed.details).trim() : "";
        if (detail && (res.status === 502 || res.status === 500) && baseMsg.length < 80) {
          baseMsg = `${baseMsg} ${detail.slice(0, 400)}`;
        }
        const haystack = `${detail} ${baseMsg}`;
        const invalidKeyLike =
          /CRITICAL:\s*Gemini API Key is missing|\b401\b|\b403\b|invalid\s*API\s*key|incorrect\s*API\s*key|API\s*key\s*not\s*valid|API_KEY_INVALID/i.test(
            haystack,
          ) ||
          /يرجى إضافة مفتاح|مفتاح\s*OpenAI|مفتاح\s*Gemini|لا يملك صلاحية الوصول إلى نموذج gemini/i.test(haystack);
        const timeoutLike =
          /timeout|مهلة|AbortError|TimeoutError/i.test(baseMsg) || /timeout|AbortError/i.test(detail);
        const msg = invalidKeyLike
          ? "مفتاح واجهة البرمجة غير صالح أو غير مُعرّف. أضف المفتاح في الإعدادات أو في ملف البيئة ثم أعد المحاولة."
          : timeoutLike
            ? "انتهت مهلة التوليد لهذا الطلب. قلّل حجم النص أو أعد المحاولة بعد لحظات."
            : withAuthHint(res, parsed, baseMsg);
        if (
          parsed &&
          Number.isInteger(parsed.failedSection) &&
          Array.isArray(parsed.partialSections) &&
          parsed.partialSections.length > 0
        ) {
          const sec = parsed.failedSection as number;
          const partial = parsed.partialSections.map((s) => String(s ?? ""));
          setPartialSections(partial);
          setFailedSection(sec);
          const stitched = partial
            .map((body, i) => `${i + 1})\n\n${body}`)
            .join("\n\n");
          if (stitched.trim()) setDraft(stitched);
          setNotice({
            message: `${msg} تم حفظ الأقسام المكتملة. يمكنك استئناف التوليد من القسم ${sec + 1}.`,
            type: "error",
          });
          return;
        }
        setNotice({ message: msg, type: "error" });
        return;
      }

      const textContent = stripMarkdownCodeFence(await res.text()).trim();
      clearGenerateProgressTimer();
      setGenerateProgress(100);
      completedSuccessfully = true;
      setDraft(textContent || null);

      setPartialSections(null);
      setFailedSection(null);
      const volHeader = res.headers.get("x-mudrik-volumes");
      const used = volHeader ? Number(volHeader) : null;
      setChunks(Number.isFinite(used) ? used : null);
      window.setTimeout(() => setGenerateProgress(0), 480);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      const timeoutLike = /timeout|مهلة|AbortError|TimeoutError/i.test(msg);
      const networkLike = /failed to fetch|networkerror|load failed|network request failed/i.test(msg);
      setNotice({
        message: timeoutLike
          ? "انتهت مهلة التوليد قبل اكتمال المسودة. حاول مرة أخرى أو قلّل حجم المدخلات."
          : networkLike
            ? "تعذر إرسال طلب التوليد بسبب انقطاع الاتصال أو كِبَر الحمولة. أعد المحاولة بعد تقليل النص."
            : msg.trim() || "تعذر إتمام التوليد. تحقق من الشبكة أو أعد المحاولة لاحقاً.",
        type: "error",
      });
    } finally {
      clearGenerateProgressTimer();
      if (!completedSuccessfully) setGenerateProgress(0);
      setBusy("idle");
    }
  }

  return (
    <AppShell title="محرك العطاءات الذكي">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <p className="text-base leading-relaxed text-mist mb-8">
              ارفع كراسة الشروط (PDF أو DOCX) لتبدأ صياغة عرضك الفني الفائز. يعمل المحرك السيادي لمُدرك
              بمثابة استشاري تقني أول؛ لتوليد مسودة هندسية عالية الكثافة تربط اشتراطات الكراسة بدقة بالغة
              مع سجل إنجازاتك واعتماداتك العالمية الموثقة في الخزنة — قد تستغرق عملية التوليد الاحترافية
              بضع دقائق لضمان الجودة المتناهية. لأعلى دقة، عيّن الحقول الثلاثة أدناه ثم ارفع الملف ليُمرَّر
              نص الكراسة كاملاً إلى المحرك مع المسودة.
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
              <label htmlFor="projectName" className="flex items-center gap-2 text-sm font-bold text-charcoal">
                <FileText size={16} className="text-mist" />
                اسم المشروع
              </label>
              <input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-charcoal outline-none transition-all focus:border-midnight/40 focus:ring-4 focus:ring-midnight/5"
                placeholder="اكتب اسم المشروع"
              />
              <label htmlFor="ownerEntity" className="flex items-center gap-2 text-sm font-bold text-charcoal">
                <FileText size={16} className="text-mist" />
                الجهة المالكة
              </label>
              <input
                id="ownerEntity"
                value={ownerEntity}
                onChange={(e) => setOwnerEntity(e.target.value)}
                className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-charcoal outline-none transition-all focus:border-midnight/40 focus:ring-4 focus:ring-midnight/5"
                placeholder="اكتب الجهة المالكة"
              />
              <label htmlFor="executionDuration" className="flex items-center gap-2 text-sm font-bold text-charcoal">
                <FileText size={16} className="text-mist" />
                مدة التنفيذ
              </label>
              <input
                id="executionDuration"
                value={executionDuration}
                onChange={(e) => setExecutionDuration(e.target.value)}
                className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-charcoal outline-none transition-all focus:border-midnight/40 focus:ring-4 focus:ring-midnight/5"
                placeholder="مثال: 18 شهراً"
              />
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
                disabled={busy !== "idle"}
                className="flex items-center gap-2 rounded-full bg-midnight px-8 py-4 text-sm font-bold text-white shadow-lg shadow-midnight/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
              >
                {busy === "generate" ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Wand2 size={18} />
                )}
                توليد المسودة الذكية
              </button>
              {failedSection !== null && partialSections && partialSections.length > 0 && (
                <button
                  type="button"
                  onClick={() => void runGenerate("resume")}
                  disabled={busy !== "idle"}
                  className="flex items-center gap-2 rounded-full border border-midnight/25 bg-white px-6 py-4 text-sm font-bold text-midnight transition hover:bg-slate-50 disabled:opacity-50"
                >
                  استئناف من القسم {failedSection + 1}
                </button>
              )}
            </div>
            {busy === "generate" && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-blue-50 px-5 py-3 border border-blue-100">
                <Loader2 size={16} className="animate-spin text-blue-700" />
                <span className="text-sm font-semibold text-blue-700">جارٍ التوليد التتابعي للمجلدات الفنية…</span>
              </div>
            )}

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
              <div className="space-y-5 py-6" aria-busy="true" aria-live="polite">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-semibold text-slate-200">
                    <Loader2 size={18} className="animate-spin text-amber-400 shrink-0" aria-hidden />
                    جاري صياغة العرض الفني…
                  </span>
                  <span className="tabular-nums text-amber-300/90 font-bold">
                    {Math.round(generateProgress)}%
                  </span>
                </div>
                <div
                  className="h-3 w-full overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(generateProgress)}
                  aria-label="تقدم التوليد"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-amber-500 to-amber-300 transition-[width] duration-300 ease-out"
                    style={{ width: `${Math.min(100, generateProgress)}%` }}
                  />
                </div>
                <p className="text-xs leading-relaxed text-white/50">
                  يتم توليد المجلدات الفنية بالتتابع؛ قد يستغرق ذلك عدة دقائق حسب حجم الكراسة. يتقدم الشريط تدريجياً حتى اكتمال الاستجابة.
                </p>
              </div>
            ) : draft ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="relative rounded-2xl border border-white/10 bg-white/5 px-5 pb-6 pt-14">
                  <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyDraftToClipboard()}
                      disabled={busy !== "idle"}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15 active:scale-[0.98] disabled:opacity-50"
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
                    <button
                      type="button"
                      onClick={() => void exportDraftAsDocx()}
                      disabled={busy !== "idle" || exportingDocx}
                      className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-100 shadow-sm backdrop-blur-sm transition hover:bg-amber-500/25 active:scale-[0.98] disabled:opacity-50"
                    >
                      {exportingDocx ? (
                        <>
                          <Loader2 size={16} className="animate-spin" aria-hidden />
                          جارٍ التصدير…
                        </>
                      ) : (
                        <>
                          <Download size={16} aria-hidden />
                          تصدير Word
                        </>
                      )}
                    </button>
                  </div>
                  <div
                    dir="rtl"
                    className="font-sans text-[15px] font-normal leading-relaxed text-slate-100 antialiased whitespace-pre-wrap break-words"
                  >
                    {draft}
                  </div>
                </div>
                {typeof chunks === "number" && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-white/40 font-medium">المجلدات الفنية المُولَّدة</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">{chunks} مجلداً</span>
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
