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

import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MudrikLogo } from "@/components/mudrik-logo";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/vault");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <Link
            href="/"
            prefetch
            className="flex items-center gap-2 text-xl font-bold text-midnight tracking-tight"
            aria-label="مُدْرِك — الرئيسية"
          >
            <div className="bg-midnight text-white p-1.5 rounded-lg">
              <MudrikLogo size={20} />
            </div>
            <span>مُدْرِك</span>
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-midnight px-6 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 shadow-lg shadow-midnight/10"
          >
            دخول المنصة
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-6 py-24 text-center">
        <h1 className="text-3xl font-bold leading-snug text-midnight md:text-4xl">
          مُدْرِك: المنصة الذكية لتحليل وإعداد عروض المناقصات والمزايدات
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-start text-base leading-relaxed text-charcoal md:text-lg">
          أتمتة دورة حياة تحليل كراسات الشروط (RFP) بدقة عالية. نقوم باستخلاص المتطلبات، ومطابقتها مع
          خبراتكم السابقة، وتوليد مسودات العروض الفنية والمالية المتوافقة آلياً، لضمان الكفاءة والامتثال
          للمعايير.
        </p>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-full bg-midnight px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-midnight/90"
          >
            ابدأ الآن
          </Link>
        </div>
      </main>
      <footer className="border-t border-slate-100 py-10 text-center text-xs text-mist">
        © {new Date().getFullYear()} مُدْرِك. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
