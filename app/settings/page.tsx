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

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { API_KEY_ONBOARDING_ACK } from "@/lib/byok";
import { createClient } from "@/lib/supabase/client";
import { ensureAnonymousSession } from "@/lib/supabase/ensure-anonymous-session";
import { Key, Cpu, Box, Save, CheckCircle2, AlertCircle, Loader2, Plug, Sparkles } from "lucide-react";
import { MunakasaLogo } from "@/components/munakasa-logo";

function isMissingGenerationEngineColumn(message: string): boolean {
  return /generation_engine/i.test(message) && /user_settings/i.test(message);
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [generationEngine, setGenerationEngine] = useState<"gemini" | "openai">("gemini");
  const [aiProvider, setAiProvider] = useState<"gemini" | "openai">("gemini");
  /** Presence only — never store actual key material from the server in React state. */
  const [hasOpenAiKey, setHasOpenAiKey] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  /** Ephemeral: only what the user types this session to set or rotate a key; cleared after save. */
  const [openaiKeyDraft, setOpenaiKeyDraft] = useState("");
  const [geminiKeyDraft, setGeminiKeyDraft] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-small");
  const [chatModel, setChatModel] = useState("gpt-4o-mini");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: "error" | "success" } | null>(null);

  /**
   * Loads settings without ever assigning model_api_key / gemini_api_key strings to React state
   * (avoids DevTools exposure). Presence flags come from RPC or default false; drafts stay empty until the user types.
   */
  const load = useCallback(async () => {
    setLoading(true);
    const user = await ensureAnonymousSession(supabase);
    const uid = user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    const { data: rpcRows, error: rpcError } = await supabase.rpc("get_user_settings_for_client");
    if (!rpcError && rpcRows !== null && rpcRows !== undefined) {
      const rows = Array.isArray(rpcRows) ? rpcRows : [rpcRows];
      const row = rows[0] as
        | {
            generation_engine?: string | null;
            ai_provider?: string | null;
            embedding_model?: string | null;
            chat_model?: string | null;
            has_openai_key?: boolean;
            has_gemini_key?: boolean;
          }
        | undefined;
      if (row) {
        const ge = row.generation_engine;
        setGenerationEngine(ge === "openai" ? "openai" : "gemini");
        setAiProvider(row.ai_provider === "openai" ? "openai" : "gemini");
        setHasOpenAiKey(Boolean(row.has_openai_key));
        setHasGeminiKey(Boolean(row.has_gemini_key));
        setOpenaiKeyDraft("");
        setGeminiKeyDraft("");
        setEmbeddingModel(row.embedding_model ?? "text-embedding-3-small");
        setChatModel(row.chat_model ?? "gpt-4o-mini");
      }
    } else {
      let { data, error } = await supabase
        .from("user_settings")
        .select("generation_engine, ai_provider, embedding_model, chat_model")
        .eq("user_id", uid)
        .maybeSingle();
      if (error && isMissingGenerationEngineColumn(error.message)) {
        const retry = await supabase
          .from("user_settings")
          .select("ai_provider, embedding_model, chat_model")
          .eq("user_id", uid)
          .maybeSingle();
        data = retry.data as typeof data;
        error = retry.error;
      }
      if (data) {
        const row = data as {
          generation_engine?: string | null;
          ai_provider?: string | null;
          embedding_model?: string | null;
          chat_model?: string | null;
        };
        const ge = row.generation_engine;
        setGenerationEngine(ge === "openai" ? "openai" : "gemini");
        setAiProvider(row.ai_provider === "openai" ? "openai" : "gemini");
        setHasOpenAiKey(false);
        setHasGeminiKey(false);
        setOpenaiKeyDraft("");
        setGeminiKeyDraft("");
        setEmbeddingModel(row.embedding_model ?? "text-embedding-3-small");
        setChatModel(row.chat_model ?? "gpt-4o-mini");
      }
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    const user = await ensureAnonymousSession(supabase);
    const uid = user?.id;
    if (!uid) {
      setSaving(false);
      setNotice({ message: "تعذر بدء الجلسة. أعد تحميل الصفحة.", type: "error" });
      return;
    }
    const openaiTrim = openaiKeyDraft.trim();
    const geminiTrim = geminiKeyDraft.trim();

    const baseFields = {
      generation_engine: generationEngine,
      ai_provider: aiProvider,
      embedding_model: embeddingModel.trim(),
      chat_model: chatModel.trim(),
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase.from("user_settings").select("user_id").eq("user_id", uid).maybeSingle();

    let error: { message: string } | null = null;
    if (existing) {
      const patch: Record<string, string | null> = { ...baseFields };
      if (openaiTrim) patch.model_api_key = openaiTrim;
      if (geminiTrim) patch.gemini_api_key = geminiTrim;
      let res = await supabase.from("user_settings").update(patch).eq("user_id", uid);
      if (res.error && isMissingGenerationEngineColumn(res.error.message)) {
        const { generation_engine: _ignored, ...legacyPatch } = patch;
        res = await supabase.from("user_settings").update(legacyPatch).eq("user_id", uid);
      }
      error = res.error;
    } else {
      let res = await supabase.from("user_settings").insert({
        user_id: uid,
        ...baseFields,
        model_api_key: openaiTrim || null,
        gemini_api_key: geminiTrim || null,
      });
      if (res.error && isMissingGenerationEngineColumn(res.error.message)) {
        const { generation_engine: _ignored, ...legacyBaseFields } = baseFields;
        res = await supabase.from("user_settings").insert({
          user_id: uid,
          ...legacyBaseFields,
          model_api_key: openaiTrim || null,
          gemini_api_key: geminiTrim || null,
        });
      }
      error = res.error;
    }

    setSaving(false);
    if (error) {
      setNotice({ message: error.message, type: "error" });
      return;
    }
    if (openaiTrim) setHasOpenAiKey(true);
    if (geminiTrim) setHasGeminiKey(true);
    if (openaiTrim || geminiTrim) {
      window.localStorage.setItem(API_KEY_ONBOARDING_ACK, "1");
    }
    setOpenaiKeyDraft("");
    setGeminiKeyDraft("");
    setNotice({ message: "تم حفظ الإعدادات بنجاح.", type: "success" });
  }

  return (
    <AppShell title="إعدادات المنصة">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="bg-surface rounded-[2rem] p-8 md:p-10 shadow-[0_4px_50px_rgba(0,51,52,0.05)]">
            <div className="flex items-center gap-3 mb-8 pb-6 shadow-[0_1px_0_rgba(0,106,103,0.08)]">
              <div className="bg-secondary/10 p-3 rounded-2xl">
                <MunakasaLogo size={24} className="text-midnight" />
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
                {!hasGeminiKey ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                    <p className="font-bold">مفتاح Gemini مطلوب (BYOK)</p>
                    <p className="mt-1 leading-relaxed text-amber-900/90">
                      المنصة لا توفّر مفاتيح API مشتركة. أضف مفتاح Google Gemini الخاص بك أدناه لتفعيل
                      توليد العروض والخزنة الذكية. يمكنك لاحقاً إضافة مفتاح OpenAI اختيارياً.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-6 order-first">
                  <div className="space-y-3 rounded-2xl border-2 border-secondary/25 bg-secondary/5 p-5">
                    <label
                      htmlFor="geminiKey"
                      className="flex items-center gap-2 text-sm font-bold text-charcoal"
                    >
                      <Sparkles size={16} className="text-secondary" />
                      مفتاح Gemini (مطلوب)
                    </label>
                    <input
                      id="geminiKey"
                      name="geminiKey"
                      type="password"
                      autoComplete="off"
                      value={geminiKeyDraft}
                      onChange={(e) => setGeminiKeyDraft(e.target.value)}
                      className="w-full rounded-2xl border border-ghost bg-surface px-5 py-4 text-sm text-charcoal outline-none focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10 transition-all"
                      placeholder="AIzaSy•••••••••••••••••••••••"
                    />
                    <p className="text-xs leading-relaxed text-mist px-1">
                      يُستخدم لتوليد العروض الفنية، وتحليل الفجوات، والتضمين عند اختيار جميناي للخزنة.
                    </p>
                    {hasGeminiKey && !geminiKeyDraft.trim() ? (
                      <p className="text-xs font-medium text-emerald-800 px-1">يوجد مفتاح محفوظ. اكتب مفتاحاً جديداً فقط إذا أردت الاستبدال.</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="generationEngine"
                    className="flex items-center gap-2 text-sm font-bold text-charcoal"
                  >
                    <Cpu size={16} className="text-mist" />
                    محرك توليد العروض (Model Selector)
                  </label>
                  <select
                    id="generationEngine"
                    value={generationEngine}
                    onChange={(e) => {
                      const v = e.target.value;
                      setGenerationEngine(v === "openai" ? "openai" : "gemini");
                    }}
                    className="w-full rounded-2xl border border-ghost bg-surface px-5 py-4 text-sm text-charcoal outline-none focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10 transition-all appearance-none"
                  >
                    <option value="gemini">مزود الذكاء الاصطناعي — Gemini Flash</option>
                    <option value="openai">مزود الذكاء الاصطناعي — GPT-4o (OpenAI)</option>
                  </select>
                  <p className="text-xs leading-relaxed text-mist px-1">
                    التوليد يتم عبر مزود الذكاء الاصطناعي الذي تختاره باستخدام مفتاحك الخاص المحفوظ في الإعدادات فقط.
                  </p>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="provider"
                    className="flex items-center gap-2 text-sm font-bold text-charcoal"
                  >
                    <Plug size={16} className="text-mist" />
                    مزود التضمين والخزنة الذكية (Embeddings / RAG)
                  </label>
                  <select
                    id="provider"
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value === "openai" ? "openai" : "gemini")}
                    className="w-full rounded-2xl border border-ghost bg-surface px-5 py-4 text-sm text-charcoal outline-none focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10 transition-all appearance-none"
                  >
                    <option value="gemini">جميناي</option>
                    <option value="openai">أوبن إيه آي (OpenAI Embeddings)</option>
                  </select>
                </div>

                <div className="space-y-6">
                  {(aiProvider === "openai" || generationEngine === "openai") ? (
                    <div className="space-y-3">
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
                        value={openaiKeyDraft}
                        onChange={(e) => setOpenaiKeyDraft(e.target.value)}
                        className="w-full rounded-2xl border border-ghost bg-surface px-5 py-4 text-sm text-charcoal outline-none focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10 transition-all"
                        placeholder="sk-••••••••••••••••••••••••"
                      />
                      <p className="text-xs leading-relaxed text-mist px-1">
                        يُستخدم للتضمين عند اختيار OpenAI للخزنة، وللتوليد السحابي عند اختيار GPT في محرك العروض.
                      </p>
                      {hasOpenAiKey && !openaiKeyDraft.trim() ? (
                        <p className="text-xs font-medium text-emerald-800 px-1">يوجد مفتاح محفوظ. اكتب مفتاحاً جديداً فقط إذا أردت الاستبدال.</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {aiProvider === "openai" || generationEngine === "openai" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {aiProvider === "openai" ? (
                      <div className="space-y-3">
                        <label htmlFor="emb" className="flex items-center gap-2 text-sm font-bold text-charcoal">
                          <Box size={16} className="text-mist" />
                          نموذج التضمين
                        </label>
                        <select
                          id="emb"
                          value={embeddingModel}
                          onChange={(e) => setEmbeddingModel(e.target.value)}
                          className="w-full rounded-2xl border border-ghost bg-surface px-5 py-4 text-sm text-charcoal outline-none focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10 transition-all appearance-none"
                        >
                          <option value="text-embedding-3-small">text-embedding-3-small (أسرع)</option>
                          <option value="text-embedding-3-large">text-embedding-3-large (أدق)</option>
                          <option value="text-embedding-ada-002">text-embedding-ada-002 (كلاسيكي)</option>
                        </select>
                      </div>
                    ) : null}

                    {generationEngine === "openai" ? (
                      <div className="space-y-3">
                        <label htmlFor="chat" className="flex items-center gap-2 text-sm font-bold text-charcoal">
                          <Cpu size={16} className="text-mist" />
                          نموذج التوليد (OpenAI)
                        </label>
                        <select
                          id="chat"
                          value={chatModel}
                          onChange={(e) => setChatModel(e.target.value)}
                          className="w-full rounded-2xl border border-ghost bg-surface px-5 py-4 text-sm text-charcoal outline-none focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10 transition-all appearance-none"
                        >
                          <option value="gpt-4o-mini">gpt-4o-mini (اقتصادي)</option>
                          <option value="gpt-4o">gpt-4o (قوي جداً)</option>
                          <option value="o1-preview">o1-preview (تفكير عميق)</option>
                        </select>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {notice && (
                  <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
                    notice.type === "error" ? "bg-red-50 text-red-700" : "bg-secondary/10 text-secondary"
                  }`}>
                    {notice.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    {notice.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-full bg-primary px-10 py-4 text-sm font-bold text-surface shadow-lg shadow-primary/20 transition-all hover:bg-[#042323] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
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
          <div className="bg-surface rounded-[2rem] p-8 shadow-[0_4px_50px_rgba(0,51,52,0.04)]">
            <h3 className="text-lg font-bold text-midnight mb-4">لماذا BYOK؟</h3>
            <p className="text-sm leading-relaxed text-mist">
              نتبع سياسة &quot;أحضر مفتاحك الخاص&quot; (Bring Your Own Key): لا نخزّن مفاتيح مشتركة على الخادم.
              أنت تضيف مفتاح Gemini (واختيارياً OpenAI) من حسابك، وتدفع فقط مقابل استهلاكك لدى المزود.
            </p>
          </div>
          
          <div className="bg-midnight rounded-[2rem] p-8 text-white">
            <h3 className="text-lg font-bold mb-4">نصيحة تقنية</h3>
            <p className="text-sm leading-relaxed text-white/70">
              للحصول على أفضل توازن بين السرعة والجودة في معالجة المناقصات العربية، نوصي باستخدام:
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs shadow-[0_1px_0_rgba(247,250,250,0.08)] pb-2">
                <span className="text-white/40">للتضمين:</span>
                <span className="font-mono text-white">text-embedding-3-small</span>
              </div>
              <div className="flex items-center justify-between text-xs shadow-[0_1px_0_rgba(247,250,250,0.08)] pb-2">
                <span className="text-white/40">للتوليد:</span>
                <span className="font-mono text-white">gpt-4o-mini</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
