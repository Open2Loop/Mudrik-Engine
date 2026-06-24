"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, X } from "lucide-react";
import { API_KEY_ONBOARDING_ACK } from "@/lib/byok";
import { createClient } from "@/lib/supabase/client";
import { ensureAnonymousSession } from "@/lib/supabase/ensure-anonymous-session";

function readAck(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(API_KEY_ONBOARDING_ACK) === "1";
}

export function ApiKeyOnboardingBanner() {
  const supabase = useMemo(() => createClient(), []);
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(API_KEY_ONBOARDING_ACK, "1");
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function evaluate() {
      if (readAck()) {
        if (!cancelled) {
          setVisible(false);
          setChecking(false);
        }
        return;
      }

      const user = await ensureAnonymousSession(supabase);
      if (!user) {
        if (!cancelled) {
          setVisible(true);
          setChecking(false);
        }
        return;
      }

      const { data: rpcRows, error } = await supabase.rpc("get_user_settings_for_client");
      if (!cancelled) {
        if (!error && rpcRows != null) {
          const rows = Array.isArray(rpcRows) ? rpcRows : [rpcRows];
          const row = rows[0] as { has_gemini_key?: boolean } | undefined;
          if (row?.has_gemini_key) {
            window.localStorage.setItem(API_KEY_ONBOARDING_ACK, "1");
            setVisible(false);
          } else {
            setVisible(true);
          }
        } else {
          setVisible(true);
        }
        setChecking(false);
      }
    }

    void evaluate();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (checking || !visible) return null;

  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-5 py-4 text-sm text-amber-950 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <KeyRound size={18} aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="font-bold text-amber-950">مفتاحك الخاص مطلوب للتوليد</p>
          <p className="leading-relaxed text-amber-900/90">
            المنصة لا توفّر مفاتيح API مشتركة. أضف مفتاح Gemini الخاص بك (واختيارياً OpenAI) من
            الإعدادات قبل استخدام المحرك أو الخزنة الذكية.
          </p>
          <Link
            href="/settings"
            className="inline-flex font-bold text-secondary underline-offset-2 hover:underline"
          >
            الانتقال إلى الإعدادات
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="inline-flex shrink-0 items-center justify-center gap-1 self-end rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100 sm:self-center"
        aria-label="إخفاء التنبيه"
      >
        <X size={14} aria-hidden />
        فهمت
      </button>
    </div>
  );
}
