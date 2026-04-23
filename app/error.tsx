"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-2xl rounded-3xl bg-surface p-8 shadow-[0_4px_50px_rgba(0,51,52,0.06)]">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-red-50 p-3 text-red-600">
            <AlertCircle size={22} />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-extrabold text-midnight">حدث خلل غير متوقع</h2>
            <p className="text-sm leading-relaxed text-mist">
              تعذر إكمال العملية الحالية. تمت حماية الجلسة ويمكنك إعادة المحاولة دون فقدان العمل.
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-midnight px-6 py-3 text-sm font-bold text-surface transition hover:bg-[#042323]"
            >
              <RefreshCw size={16} />
              إعادة المحاولة
            </button>
            {error?.digest ? <p className="text-xs text-mist">Ref: {error.digest}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
