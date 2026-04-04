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

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Building2, BriefcaseBusiness, ShieldCheck, Save, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

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

export default function CompanyProfilePage() {
  const [model, setModel] = useState<ProfileModel>({
    companyOverview: "",
    services: "",
    pastProjects: "",
    certificates: "",
  });
  const [notice, setNotice] = useState<Notice | null>(null);

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

  return (
    <AppShell title="ملف تعريف الشركة">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
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
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm leading-relaxed text-charcoal outline-none transition-all focus:border-midnight/40 focus:bg-white focus:ring-4 focus:ring-midnight/5"
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
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm leading-relaxed text-charcoal outline-none transition-all focus:border-midnight/40 focus:bg-white focus:ring-4 focus:ring-midnight/5"
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
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm leading-relaxed text-charcoal outline-none transition-all focus:border-midnight/40 focus:bg-white focus:ring-4 focus:ring-midnight/5"
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
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm leading-relaxed text-charcoal outline-none transition-all focus:border-midnight/40 focus:bg-white focus:ring-4 focus:ring-midnight/5"
                  placeholder="ISO، شهادات جودة، تصنيفات، اعتمادات قطاعية."
                />
              </div>
            </div>

            {notice && (
              <div
                className={`mt-6 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium ${
                  notice.type === "success"
                    ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border border-red-100 bg-red-50 text-red-700"
                }`}
              >
                {notice.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {notice.message}
              </div>
            )}

            <div className="mt-8 flex items-center justify-end">
              <button
                type="button"
                onClick={onSave}
                className="inline-flex items-center gap-2 rounded-full bg-midnight px-7 py-3 text-sm font-bold text-white shadow-lg shadow-midnight/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0"
              >
                <Save size={16} />
                حفظ ملف الشركة
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-midnight">تحليل سريع للجاهزية</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-mist">إجمالي الكلمات</span>
                <span className="font-bold text-midnight">{analysis.words}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-mist">عدد الخدمات</span>
                <span className="font-bold text-midnight">{analysis.servicesCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-mist">عدد المشاريع</span>
                <span className="font-bold text-midnight">{analysis.projectsCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-mist">عدد الشهادات</span>
                <span className="font-bold text-midnight">{analysis.certificatesCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
