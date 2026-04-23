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

import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Building2, BriefcaseBusiness, ShieldCheck, Save, Sparkles, CheckCircle2, AlertCircle, Link2, FileUp, Loader2, Trash2 } from "lucide-react";

type Notice = { message: string; type: "success" | "error" };

type ProfileModel = {
  companyOverview: string;
  services: string;
  pastProjects: string;
  certificates: string;
};

const STORAGE_KEY = "mudrik_company_profile_v1";

function analyzeProfile(model: ProfileModel) {
  const merged = `${model.companyOverview}\n${model.services}\n${model.pastProjects}\n${model.certificates}`.trim();
  const words = merged ? merged.split(/\s+/).length : 0;
  const servicesCount = model.services
    .split(/\n|،|,/)
    .map((x) => x.trim())
    .filter(Boolean).length;
  const projectsCount = model.pastProjects
    .split(/\n|؛|,/)
    .map((x) => x.trim())
    .filter(Boolean).length;
  const certificatesCount = model.certificates
    .split(/\n|،|,/)
    .map((x) => x.trim())
    .filter(Boolean).length;

  return { words, servicesCount, projectsCount, certificatesCount };
}

function extractProfileFromText(text: string): ProfileModel {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const keywords = {
    overview: /نبذة|عن الشركة|من نحن|company overview|about/i,
    services: /الخدمات|services|نطاق العمل/i,
    projects: /المشاريع|سابقة|projects|references/i,
    certificates: /الشهادات|الاعتمادات|certifications|iso/i,
  };
  const bucket = {
    overview: [] as string[],
    services: [] as string[],
    projects: [] as string[],
    certificates: [] as string[],
  };
  let current: keyof typeof bucket = "overview";
  for (const line of lines) {
    if (keywords.overview.test(line)) {
      current = "overview";
      continue;
    }
    if (keywords.services.test(line)) {
      current = "services";
      continue;
    }
    if (keywords.projects.test(line)) {
      current = "projects";
      continue;
    }
    if (keywords.certificates.test(line)) {
      current = "certificates";
      continue;
    }
    bucket[current].push(line);
  }
  const compact = lines.slice(0, 6).join("\n");
  return {
    companyOverview: bucket.overview.join("\n").trim() || compact,
    services: bucket.services.join("\n").trim(),
    pastProjects: bucket.projects.join("\n").trim(),
    certificates: bucket.certificates.join("\n").trim(),
  };
}

export default function CompanyProfilePage() {
  const [model, setModel] = useState<ProfileModel>({
    companyOverview: "",
    services: "",
    pastProjects: "",
    certificates: "",
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [smartImportUrl, setSmartImportUrl] = useState("");
  const [smartImportDrag, setSmartImportDrag] = useState(false);
  const [smartImportFile, setSmartImportFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const smartImportFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ProfileModel>;
      setModel({
        companyOverview: typeof parsed.companyOverview === "string" ? parsed.companyOverview : "",
        services: typeof parsed.services === "string" ? parsed.services : "",
        pastProjects: typeof parsed.pastProjects === "string" ? parsed.pastProjects : "",
        certificates: typeof parsed.certificates === "string" ? parsed.certificates : "",
      });
    } catch {
      // Ignore malformed local state and continue with blank form.
    }
  }, []);

  const analysis = useMemo(() => analyzeProfile(model), [model]);

  function onSave() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
      setNotice({ message: "تم حفظ ملف الشركة محلياً بنجاح.", type: "success" });
    } catch {
      setNotice({ message: "تعذر حفظ البيانات محلياً على المتصفح.", type: "error" });
    }
  }

  function resetProfile() {
    const ok = window.confirm(
      "هل أنت متأكد من حذف كافة بيانات ملف الشركة من هذه الصفحة؟ لا يمكن التراجع عن هذا الإجراء.",
    );
    if (!ok) return;
    setModel({
      companyOverview: "",
      services: "",
      pastProjects: "",
      certificates: "",
    });
    setNotice(null);
    setSmartImportUrl("");
    clearSmartImportFile();
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors (private mode / quota).
    }
  }

  function isAcceptedSmartImportFile(file: File) {
    const accepted = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    return accepted.includes(file.type) || /\.pdf$/i.test(file.name) || /\.docx$/i.test(file.name);
  }

  function onSmartImportFileChosen(files: FileList | null) {
    const file = files?.[0];
    if (!file || !isAcceptedSmartImportFile(file)) return;
    setSmartImportFile(file);
  }

  function clearSmartImportFile() {
    setSmartImportFile(null);
    if (smartImportFileInputRef.current) {
      smartImportFileInputRef.current.value = "";
    }
  }

  async function onSmartImportAnalyze() {
    if (isLoading) return;
    const urlTrimmed = smartImportUrl.trim();
    if (!smartImportFile && !urlTrimmed) {
      setNotice({ message: "أدخل رابط الموقع أو ارفع ملفاً قبل بدء التحليل.", type: "error" });
      return;
    }
    const file = smartImportFile;
    if (!file && !urlTrimmed) return;

    setIsLoading(true);
    setNotice(null);
    try {
      let res: Response;
      if (file) {
        const formData = new FormData();
        formData.set("rfp", file);
        res = await fetch("/api/engine/analyze", { method: "POST", body: formData });
      } else {
        res = await fetch("/api/company-profile/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlTrimmed }),
        });
      }

      const data = (await res.json()) as { error?: string; text?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "تعذر تحليل الملف.");
      }
      const extracted = extractProfileFromText(data.text ?? "");
      setModel((prev) => ({
        companyOverview: extracted.companyOverview || prev.companyOverview,
        services: extracted.services || prev.services,
        pastProjects: extracted.pastProjects || prev.pastProjects,
        certificates: extracted.certificates || prev.certificates,
      }));
      setNotice({ message: "تم التحليل والاستخراج بنجاح.", type: "success" });
    } catch (e) {
      setNotice({ message: e instanceof Error ? e.message : "حدث خطأ غير متوقع أثناء التحليل.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell title="ملف تعريف الشركة">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <div className="rounded-[2rem] bg-surface p-8 shadow-[0_4px_50px_rgba(0,51,52,0.05)]">
            <div className="mb-6 flex items-center gap-2 shadow-[0_1px_0_rgba(0,106,103,0.08)] pb-4">
              <div className="rounded-2xl bg-secondary/10 p-2.5">
                <Sparkles size={20} className="text-secondary" />
              </div>
              <h2 className="text-xl font-bold text-primary">استيراد ذكي لملف الشركة</h2>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-mist">
              أدخل رابط الموقع أو ارفع مستند PDF / DOCX لاستخراج المحتوى تلقائياً وتعبئة الحقول لاحقاً.
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="smartImportWebsite" className="flex items-center gap-2 text-sm font-bold text-charcoal">
                  <Link2 size={16} className="text-mist" />
                  رابط الموقع
                </label>
                <input
                  id="smartImportWebsite"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  value={smartImportUrl}
                  onChange={(e) => setSmartImportUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-2xl border border-ghost bg-surface px-4 py-3 text-sm text-charcoal outline-none transition-all focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10"
                />
              </div>
              <div className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-bold text-charcoal">
                  <FileUp size={16} className="text-mist" />
                  رفع ملف
                </span>
                <input
                  ref={smartImportFileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => onSmartImportFileChosen(e.target.files)}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      smartImportFileInputRef.current?.click();
                    }
                  }}
                  onClick={() => smartImportFileInputRef.current?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setSmartImportDrag(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setSmartImportDrag(false);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setSmartImportDrag(false);
                    onSmartImportFileChosen(e.dataTransfer.files);
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors md:py-12 ${
                    smartImportDrag
                      ? "border-secondary bg-secondary/8"
                      : "border-ghost bg-surface/80 hover:border-secondary/30 hover:bg-secondary/5"
                  }`}
                >
                  <FileUp size={28} className="mb-2 text-mist" />
                  <p className="text-sm font-semibold text-charcoal">اسحب الملف هنا أو اضغط للاختيار</p>
                  <p className="mt-1 text-xs text-mist">PDF أو DOCX فقط</p>
                  {smartImportFile ? (
                    <div className="mt-3 flex max-w-full items-center justify-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-xs font-medium text-midnight" title={smartImportFile.name}>
                        {smartImportFile.name}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSmartImportFile();
                        }}
                        className="shrink-0 rounded-lg p-1 text-red-500/80 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label="إزالة الملف"
                        title="إزالة الملف"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={onSmartImportAnalyze}
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-surface shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-[#042323] active:translate-y-0 sm:w-auto"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isLoading ? "جاري التحليل..." : "تحليل واستخراج بالذكاء الاصطناعي"}
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] bg-surface p-8 shadow-[0_4px_50px_rgba(0,51,52,0.05)]">
            <p className="mb-6 text-sm leading-relaxed text-mist">
              هذا النموذج مخصص لتجهيز سياق الشركة بصورة احترافية لتغذية مسودات العروض الفنية. أدخل البيانات بصياغة واضحة
              ومباشرة، ثم احفظها بشكل دوري.
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="companyOverview" className="flex items-center gap-2 text-sm font-bold text-charcoal">
                  <Building2 size={16} className="text-mist" />
                  نبذة الشركة
                </label>
                <textarea
                  id="companyOverview"
                  rows={5}
                  value={model.companyOverview}
                  onChange={(e) => setModel((prev) => ({ ...prev, companyOverview: e.target.value }))}
                  className="w-full resize-none rounded-2xl border border-ghost bg-surface px-4 py-3 text-sm leading-relaxed text-charcoal outline-none transition-all focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10"
                  placeholder="قدّم تعريفاً موجزاً عن الشركة، قطاعات العمل، ونطاق التغطية الجغرافية."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="services" className="flex items-center gap-2 text-sm font-bold text-charcoal">
                  <BriefcaseBusiness size={16} className="text-mist" />
                  الخدمات الرئيسية
                </label>
                <textarea
                  id="services"
                  rows={5}
                  value={model.services}
                  onChange={(e) => setModel((prev) => ({ ...prev, services: e.target.value }))}
                  className="w-full resize-none rounded-2xl border border-ghost bg-surface px-4 py-3 text-sm leading-relaxed text-charcoal outline-none transition-all focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10"
                  placeholder="مثال: حلول أمنية متقدمة، أنظمة مراقبة، إدارة مرافق، تشغيل وصيانة..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="projects" className="flex items-center gap-2 text-sm font-bold text-charcoal">
                  <Sparkles size={16} className="text-mist" />
                  المشاريع السابقة
                </label>
                <textarea
                  id="projects"
                  rows={6}
                  value={model.pastProjects}
                  onChange={(e) => setModel((prev) => ({ ...prev, pastProjects: e.target.value }))}
                  className="w-full resize-none rounded-2xl border border-ghost bg-surface px-4 py-3 text-sm leading-relaxed text-charcoal outline-none transition-all focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10"
                  placeholder="اكتب كل مشروع في سطر مستقل مع الجهة والنتيجة الرئيسية."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="certificates" className="flex items-center gap-2 text-sm font-bold text-charcoal">
                  <ShieldCheck size={16} className="text-mist" />
                  الشهادات والاعتمادات
                </label>
                <textarea
                  id="certificates"
                  rows={4}
                  value={model.certificates}
                  onChange={(e) => setModel((prev) => ({ ...prev, certificates: e.target.value }))}
                  className="w-full resize-none rounded-2xl border border-ghost bg-surface px-4 py-3 text-sm leading-relaxed text-charcoal outline-none transition-all focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10"
                  placeholder="ISO، شهادات جودة، تصنيفات، اعتمادات قطاعية."
                />
              </div>
            </div>

            {notice && (
              <div
                className={`mt-6 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium ${
                  notice.type === "success"
                    ? "bg-secondary/10 text-secondary"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {notice.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {notice.message}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={onSave}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-bold text-surface shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-[#042323] active:translate-y-0"
              >
                <Save size={16} />
                حفظ ملف الشركة
              </button>
              <button
                type="button"
                onClick={resetProfile}
                className="inline-flex items-center gap-2 rounded-full bg-red-50 px-6 py-3 text-sm font-semibold text-red-600 shadow-sm transition-all hover:bg-red-100 active:translate-y-0"
              >
                حذف كافة البيانات
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-[2rem] bg-surface p-7 shadow-[0_4px_50px_rgba(0,51,52,0.05)]">
            <h3 className="mb-4 text-lg font-bold text-primary">تحليل سريع للجاهزية</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-secondary/8 px-3 py-2">
                <span className="text-mist">إجمالي الكلمات</span>
                <span className="font-bold text-primary">{analysis.words}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-secondary/8 px-3 py-2">
                <span className="text-mist">عدد الخدمات</span>
                <span className="font-bold text-primary">{analysis.servicesCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-secondary/8 px-3 py-2">
                <span className="text-mist">عدد المشاريع</span>
                <span className="font-bold text-primary">{analysis.projectsCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-secondary/8 px-3 py-2">
                <span className="text-mist">عدد الشهادات</span>
                <span className="font-bold text-primary">{analysis.certificatesCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
