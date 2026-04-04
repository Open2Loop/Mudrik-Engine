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

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";
import { Key, Cpu, Box, Save, CheckCircle2, AlertCircle, Loader2, Plug, Sparkles } from "lucide-react";
import { MudrikLogo } from "@/components/mudrik-logo";

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [aiProvider, setAiProvider] = useState<"gemini" | "openai">("gemini");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-small");
  const [chatModel, setChatModel] = useState("gpt-4o-mini");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("user_settings").select("*").eq("user_id", uid).maybeSingle();
    if (data) {
      setAiProvider(data.ai_provider === "openai" ? "openai" : "gemini");
      setOpenaiApiKey(data.model_api_key ?? "");
      setGeminiApiKey(data.gemini_api_key ?? "");
      setEmbeddingModel(data.embedding_model ?? "text-embedding-3-small");
      setChatModel(data.chat_model ?? "gpt-4o-mini");
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setSaving(false);
      setNotice({ message: "انتهت الجلسة.", type: "error" });
      return;
    }
    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: uid,
        ai_provider: aiProvider,
        model_api_key: openaiApiKey.trim() || null,
        gemini_api_key: geminiApiKey.trim() || null,
        embedding_model: embeddingModel.trim(),
        chat_model: chatModel.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      setNotice({ message: error.message, type: "error" });
      return;
    }
    setNotice({ message: "تم حفظ الإعدادات بنجاح.", type: "success" });
  }

  return (
    <AppShell title="إعدادات المنصة">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 md:p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
              <div className="bg-slate-100 p-3 rounded-2xl">
                <MudrikLogo size={24} className="text-midnight" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-midnight">تكوين النماذج</h2>
                <p className="text-sm text-mist">تحكم في محركات الذكاء الاصطناعي المستخدمة</p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={32} className="animate-spin text-midnight/20" />
                <p className="text-sm font-medium text-mist">جارٍ تحميل الإعدادات…</p>
              </div>
            ) : (
              <form onSubmit={onSave} className="space-y-8">
                <div className="space-y-3">
                  <label
                    htmlFor="provider"
                    className="flex items-center gap-2 text-sm font-bold text-charcoal"
                  >
                    <Plug size={16} className="text-mist" />
                    مزود الذكاء الاصطناعي (AI Provider)
                  </label>
                  <select
                    id="provider"
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value === "openai" ? "openai" : "gemini")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm text-charcoal outline-none focus:border-midnight/40 focus:bg-white focus:ring-4 focus:ring-midnight/5 transition-all appearance-none"
                  >
                    <option value="gemini">جوجل جيمني (مجاني/Gemini)</option>
                    <option value="openai">أوبن إيه آي (OpenAI)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  {aiProvider === "openai" ? (
                    <>
                      <label
                        htmlFor="openaiKey"
                        className="flex items-center gap-2 text-sm font-bold text-charcoal"
                      >
                        <Key size={16} className="text-mist" />
                        مفتاح OpenAI
                      </label>
                      <input
                        id="openaiKey"
                        name="openaiKey"
                        type="password"
                        autoComplete="off"
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm text-charcoal outline-none focus:border-midnight/40 focus:bg-white focus:ring-4 focus:ring-midnight/5 transition-all"
                        placeholder="sk-••••••••••••••••••••••••"
                      />
                      <p className="text-xs leading-relaxed text-mist px-1">
                        يُستخدم هذا المفتاح للتضمين والبحث (RAG) والتوليد عند اختيار OpenAI.
                      </p>
                    </>
                  ) : (
                    <>
                      <label
                        htmlFor="geminiKey"
                        className="flex items-center gap-2 text-sm font-bold text-charcoal"
                      >
                        <Sparkles size={16} className="text-mist" />
                        مفتاح Gemini
                      </label>
                      <input
                        id="geminiKey"
                        name="geminiKey"
                        type="password"
                        autoComplete="off"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm text-charcoal outline-none focus:border-midnight/40 focus:bg-white focus:ring-4 focus:ring-midnight/5 transition-all"
                        placeholder="AIzaSy•••••••••••••••••••••••"
                      />
                      <p className="text-xs leading-relaxed text-mist px-1">
                        يُستخدم هذا المفتاح للتوليد عبر Gemini عند اختيار مزود Gemini.
                      </p>
                    </>
                  )}
                </div>

                {aiProvider === "openai" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label htmlFor="emb" className="flex items-center gap-2 text-sm font-bold text-charcoal">
                        <Box size={16} className="text-mist" />
                        نموذج التضمين
                      </label>
                      <select
                        id="emb"
                        value={embeddingModel}
                        onChange={(e) => setEmbeddingModel(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm text-charcoal outline-none focus:border-midnight/40 focus:bg-white focus:ring-4 focus:ring-midnight/5 transition-all appearance-none"
                      >
                        <option value="text-embedding-3-small">text-embedding-3-small (أسرع)</option>
                        <option value="text-embedding-3-large">text-embedding-3-large (أدق)</option>
                        <option value="text-embedding-ada-002">text-embedding-ada-002 (كلاسيكي)</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="chat" className="flex items-center gap-2 text-sm font-bold text-charcoal">
                        <Cpu size={16} className="text-mist" />
                        نموذج التوليد
                      </label>
                      <select
                        id="chat"
                        value={chatModel}
                        onChange={(e) => setChatModel(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm text-charcoal outline-none focus:border-midnight/40 focus:bg-white focus:ring-4 focus:ring-midnight/5 transition-all appearance-none"
                      >
                        <option value="gpt-4o-mini">gpt-4o-mini (اقتصادي)</option>
                        <option value="gpt-4o">gpt-4o (قوي جداً)</option>
                        <option value="o1-preview">o1-preview (تفكير عميق)</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {notice && (
                  <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
                    notice.type === "error" ? "bg-red-50 text-red-700 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  }`}>
                    {notice.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    {notice.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-full bg-midnight px-10 py-4 text-sm font-bold text-white shadow-lg shadow-midnight/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  حفظ التغييرات
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-midnight mb-4">لماذا BYOK؟</h3>
            <p className="text-sm leading-relaxed text-mist">
              نحن نتبع سياسة &quot;أحضر مفتاحك الخاص&quot; (Bring Your Own Key) لضمان أقصى درجات الخصوصية والتحكم في التكاليف. 
              بياناتك لا تُستخدم لتدريب النماذج العامة، وأنت تدفع فقط مقابل استهلاكك الفعلي لشركة OpenAI.
            </p>
          </div>
          
          <div className="bg-midnight rounded-[2rem] p-8 text-white">
            <h3 className="text-lg font-bold mb-4">نصيحة تقنية</h3>
            <p className="text-sm leading-relaxed text-white/70">
              للحصول على أفضل توازن بين السرعة والجودة في معالجة المناقصات العربية، نوصي باستخدام:
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                <span className="text-white/40">للتضمين:</span>
                <span className="font-mono text-amber-400">text-embedding-3-small</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                <span className="text-white/40">للتوليد:</span>
                <span className="font-mono text-amber-400">gpt-4o-mini</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
