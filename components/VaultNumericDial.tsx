"use client";

/**
 * Guest access: numeric keypad. Valid code in `MUDRIK_DEMO_CODE` issues demo session
 * (HttpOnly cookie via /api/auth/demo-unlock).
 */

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { setGuestAccessCodeCookie } from "@/lib/access-code-cookie-client";
import {
  MUDRIK_ACCESS_CODE_STORAGE_KEY,
  MUDRIK_DEMO_CODE,
  MUDRIK_GUEST_SESSION_KEY,
  MUDRIK_GUEST_SESSION_VIP_2030,
} from "@/lib/demo-access-constants";

/** Must match `MUDRIK_DEMO_CODE` in `lib/demo-access-constants`. */
const MUDRIK_VIP_ACCESS_CODE = MUDRIK_DEMO_CODE;

const KEY_ORDER = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"] as const;

type VaultNumericDialProps = {
  /** When true, renders as a contained panel for use inside the login card (default). */
  embedded?: boolean;
};

function KeypadButton({
  k,
  disabled,
  onClick,
  embedded,
}: {
  k: string;
  disabled: boolean;
  onClick: () => void;
  embedded: boolean;
}) {
  if (k === "⌫") {
    if (embedded) {
      return (
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className="flex min-h-[3rem] items-center justify-center rounded-xl border border-white/15 bg-white/5 text-lg text-[#e0f5f2] transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]/50 disabled:opacity-50"
        >
          ⌫
        </button>
      );
    }
    return (
      <motion.button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="select-none text-2xl font-medium text-[#e0f5f2] drop-shadow-[0_0_12px_rgba(0,180,170,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]/60 disabled:opacity-50"
        whileHover={{ scale: 1.08, textShadow: "0 0 20px rgba(45,212,191,0.6)" }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        style={{ background: "none", border: "none", boxShadow: "none" }}
      >
        ⌫
      </motion.button>
    );
  }
  if (embedded) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="flex min-h-[3rem] items-center justify-center rounded-xl border border-white/15 bg-white/5 text-xl font-semibold text-[#e0f5f2] tabular-nums transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]/50 disabled:opacity-50"
      >
        {k}
      </button>
    );
  }
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="select-none text-2xl font-medium text-[#e0f5f2] drop-shadow-[0_0_12px_rgba(0,180,170,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]/60 disabled:opacity-50"
      whileHover={{ scale: 1.08, textShadow: "0 0 20px rgba(45,212,191,0.6)" }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      style={{ background: "none", border: "none", boxShadow: "none" }}
    >
      {k}
    </motion.button>
  );
}

export function VaultNumericDial({ embedded = true }: VaultNumericDialProps) {
  const router = useRouter();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const submitCode = useCallback(
    async (code: string) => {
      if (code.length !== 4) return;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/demo-unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(j?.error ?? "تعذر التحقق من الرمز");
          setDigits("");
          setBusy(false);
          return;
        }
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(MUDRIK_GUEST_SESSION_KEY, MUDRIK_GUEST_SESSION_VIP_2030);
            window.localStorage.setItem(MUDRIK_ACCESS_CODE_STORAGE_KEY, MUDRIK_DEMO_CODE);
            setGuestAccessCodeCookie();
          }
        } catch {
          // private mode / quota — cookie-based demo may still work
        }
        setUnlocked(true);
        await new Promise((r) => setTimeout(r, 900));
        router.push("/command-center");
      } catch {
        setError("تعذر الاتصال بالخادم");
        setDigits("");
        setBusy(false);
      }
    },
    [router],
  );

  const onKey = useCallback(
    (k: string) => {
      if (unlocked || busy) return;
      setError(null);
      if (k === "⌫") {
        setDigits((d) => d.slice(0, -1));
        return;
      }
      if (k === "") return;
      const next = (digits + k).slice(0, 4);
      setDigits(next);
      if (next.length === 4) {
        if (next === MUDRIK_VIP_ACCESS_CODE) {
          void submitCode(next);
        } else {
          setError("الرمز غير صحيح");
          setTimeout(() => setDigits(""), 400);
        }
      }
    },
    [digits, unlocked, busy, submitCode],
  );

  const content = (
    <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
      <h2 className="text-balance text-lg font-bold text-surface md:text-xl">
        الدخول برمز الوصول
      </h2>
      <p className="mt-2 max-w-sm text-pretty text-xs text-[#8fb8b5] md:text-sm leading-relaxed">
        يُرجى إدخال رمز الدخول المكوّن من أربعة أرقام بترتيبها الصحيح للمتابعة إلى واجهة
        المحرك.
      </p>

      <div className="mt-6 flex h-10 items-center justify-center gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            className="h-1 w-7 rounded-full bg-[#0d3332]"
            animate={{
              backgroundColor: digits[i] ? "#2dd4bf" : "#134e4c",
              scale: digits[i] ? 1.05 : 1,
              boxShadow: digits[i] ? "0 0 14px rgba(45,212,191,0.5)" : "none",
            }}
          />
        ))}
      </div>

      <div
        className={
          embedded
            ? "mt-6 w-full max-w-[15.5rem] grid grid-cols-3 gap-2.5 text-center"
            : "mt-8 grid w-full max-w-[17rem] grid-cols-3 gap-x-6 gap-y-5 text-center"
        }
      >
        {KEY_ORDER.map((k, idx) => {
          if (k === "") return <div key={`e-${idx}`} className="min-h-[3rem]" aria-hidden />;

          return (
            <KeypadButton
              key={k + String(idx)}
              k={k}
              embedded={embedded}
              disabled={busy}
              onClick={() => onKey(k)}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            key={error}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-sm text-amber-200/90"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {unlocked && (
        <motion.p
          className="mt-3 text-sm font-medium text-[#2dd4bf]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          جاري فتح النظام…
        </motion.p>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-[#0a1f1e] via-[#003334] to-[#001a1b] px-4 py-7 shadow-[0_12px_40px_rgba(0,51,52,0.2)]"
        dir="rtl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,106,103,0.4),transparent)]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-[110%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.1),transparent_70%)]" />
        <div className="relative">{content}</div>
      </div>
    );
  }

  return (
    <section
      className="relative w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#0a1f1e] via-[#003334] to-[#001a1b] px-4 py-12 md:py-16 shadow-[0_32px_80px_rgba(0,51,52,0.35)]"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,106,103,0.45),transparent)]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-48 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.12),transparent_70%)]" />

      {content}
    </section>
  );
}
