"use client";

import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-white text-charcoal antialiased font-sans">
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                <AlertTriangle size={22} />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-extrabold text-midnight">تعذر تحميل التطبيق</h2>
                <p className="text-sm leading-relaxed text-mist">
                  حدث خطأ عام أثناء تحميل الواجهة. أعد المحاولة الآن، وإن استمر الخطأ أعد تشغيل الخادم.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-full bg-midnight px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  إعادة المحاولة
                </button>
                {error?.digest ? <p className="text-xs text-slate-400">Ref: {error.digest}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
