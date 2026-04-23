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
    <div className="app-shell-frame bg-surface">
      {/*
        No-Line rule: the old `border-b border-slate-100` is replaced by a
        translucent surface panel with a 1-px emerald shadow-seam (tonal
        layering). No `border` property.
      */}
      <header className="bg-surface/85 backdrop-blur-md sticky top-0 z-50 shadow-[0_1px_0_rgba(0,106,103,0.08)]">
        <div className="app-shell-header-inner">
          <Link
            href="/"
            prefetch
            className="flex items-center gap-2 text-[clamp(1rem,0.9rem+0.7vw,1.35rem)] font-bold text-primary tracking-tight"
            aria-label="مُدْرِك — الرئيسية"
          >
            <div className="bg-primary text-surface p-1.5 rounded-lg">
              <MudrikLogo size={20} />
            </div>
            <span>مُدْرِك</span>
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-primary px-[clamp(0.9rem,1.5vw,1.5rem)] py-[clamp(0.5rem,0.8vw,0.75rem)] text-[clamp(0.8rem,0.74rem+0.3vw,0.95rem)] font-bold text-surface transition hover:bg-[#042323] shadow-lg shadow-primary/20"
          >
            دخول المنصة
          </Link>
        </div>
      </header>
      <main className="app-shell-main grid place-items-center text-center">
        <div className="w-full max-w-[min(92vw,54rem)]">
          <h1 className="text-[clamp(1.5rem,1.15rem+1.6vw,2.75rem)] font-bold leading-snug text-primary mudrik-heading-rule">
            مُدْرِك: المنصة الذكية لتحليل وإعداد عروض المناقصات والمزايدات
          </h1>
          <p className="mx-auto mt-[clamp(0.9rem,2.4vh,2rem)] max-w-[min(100%,42rem)] text-start text-[clamp(0.95rem,0.86rem+0.4vw,1.15rem)] leading-relaxed text-charcoal">
            أتمتة دورة حياة تحليل كراسات الشروط (RFP) بدقة عالية. نقوم باستخلاص المتطلبات، ومطابقتها مع
            خبراتكم السابقة، وتوليد مسودات العروض الفنية والمالية المتوافقة آلياً، لضمان الكفاءة والامتثال
            للمعايير.
          </p>
          <div className="mt-[clamp(1.2rem,3.8vh,3rem)] flex flex-wrap items-center justify-center gap-[clamp(0.6rem,1.2vw,1rem)]">
            <Link
              href="/login"
              className="rounded-full bg-primary px-[clamp(1.1rem,1.8vw,2rem)] py-[clamp(0.6rem,0.9vw,0.9rem)] text-[clamp(0.85rem,0.77rem+0.35vw,1rem)] font-semibold text-surface shadow-sm transition hover:bg-[#042323]"
            >
              ابدأ الآن
            </Link>
            <Link
              href="/command-center"
              className="rounded-full bg-secondary/10 px-[clamp(1.1rem,1.8vw,2rem)] py-[clamp(0.6rem,0.9vw,0.9rem)] text-[clamp(0.85rem,0.77rem+0.35vw,1rem)] font-semibold text-secondary shadow-sm transition hover:bg-secondary/20"
            >
              مركز القيادة
            </Link>
          </div>
        </div>
      </main>
      {/* No-Line rule: footer tonal separator via shadow, no border property */}
      <footer className="shadow-[0_-1px_0_rgba(0,106,103,0.08)] py-[clamp(0.9rem,2.4vh,2rem)] text-center text-[clamp(0.72rem,0.68rem+0.2vw,0.84rem)] text-mist">
        © {new Date().getFullYear()} مُدْرِك. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
