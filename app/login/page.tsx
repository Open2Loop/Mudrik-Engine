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

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogIn, ArrowRight, Mail, Lock } from "lucide-react";
import { MudrikLogo } from "@/components/mudrik-logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setMessage(null);
  }, [email, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (data?.session) {
        window.location.href = "/vault";
      } else {
        setMessage("لم يتم العثور على جلسة نشطة.");
        setLoading(false);
      }
    } catch {
      setMessage("فشل الاتصال بخدمة المصادقة. يرجى المحاولة مرة أخرى.");
      setLoading(false);
    }
  }

  return (
    <div className="app-shell-frame bg-[#F8FAFC]" dir="rtl">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="app-shell-header-inner">
          <Link href="/" className="flex items-center gap-2 text-[clamp(1rem,0.9rem+0.7vw,1.35rem)] font-bold text-midnight tracking-tight">
            <div className="bg-midnight text-white p-1.5 rounded-lg">
              <MudrikLogo size={20} />
            </div>
            <span>مُدْرِك</span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-[clamp(0.8rem,0.75rem+0.25vw,0.92rem)] font-medium text-mist hover:text-midnight transition-colors">
            <span>العودة للرئيسية</span>
            <ArrowRight size={14} className="rotate-180" />
          </Link>
        </div>
      </header>

      <main className="app-shell-main grid place-items-center">
        <div className="app-panel w-full max-w-[min(95vw,34rem)] border border-slate-200 bg-white p-[clamp(1rem,2.6vw,2.5rem)] shadow-xl shadow-slate-200/50">
          <div className="space-y-2 mb-10 text-center md:text-start">
            <h1 className="text-[clamp(1.35rem,1.1rem+1.2vw,2.1rem)] font-bold text-midnight">أهلاً بك مجدداً</h1>
            <p className="text-[clamp(0.86rem,0.8rem+0.28vw,1rem)] text-mist">قم بتسجيل الدخول للوصول إلى منصة مدرك</p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-charcoal flex items-center gap-2">
                <Mail size={16} className="text-mist" />
                البريد الإلكتروني
              </label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-[clamp(0.75rem,1.3vw,1rem)] py-[clamp(0.65rem,1.3vh,0.9rem)] text-[clamp(0.84rem,0.79rem+0.25vw,0.95rem)] outline-none focus:border-midnight/40 focus:bg-white focus:ring-4 focus:ring-midnight/5 transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-charcoal flex items-center gap-2">
                  <Lock size={16} className="text-mist" />
                  كلمة المرور
                </label>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-[clamp(0.75rem,1.3vw,1rem)] py-[clamp(0.65rem,1.3vh,0.9rem)] text-[clamp(0.84rem,0.79rem+0.25vw,0.95rem)] outline-none focus:border-midnight/40 focus:bg-white focus:ring-4 focus:ring-midnight/5 transition-all"
              />
            </div>

            {message && (
              <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-600 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden rounded-full bg-midnight py-[clamp(0.7rem,1.6vh,1rem)] text-[clamp(0.84rem,0.79rem+0.25vw,0.95rem)] font-bold text-white shadow-lg shadow-midnight/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-mist">
              ليس لديك حساب؟{" "}
              <Link href="mailto:info@mudrik.ai" className="font-semibold text-midnight hover:underline underline-offset-4">
                تواصل معنا
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-[clamp(0.8rem,1.8vh,1.5rem)] text-center">
          <p className="text-[clamp(0.72rem,0.68rem+0.2vw,0.84rem)] text-mist/60 font-medium">
            &copy; {new Date().getFullYear()} مدرك للحلول الذكية. جميع الحقوق محفوظة.
          </p>
        </div>
      </main>
    </div>
  );
}
