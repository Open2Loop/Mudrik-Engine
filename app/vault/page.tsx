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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { formatUtcTimestamp } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { FileUp, FileText, CheckCircle2, Clock, AlertCircle, Trash2, Search } from "lucide-react";

type VaultRow = {
  id: string;
  filename?: string | null;
  status?: string | null;
  created_at: string;
  error_message: string | null;
  storage_path: string;
  size_bytes: number;
  mime: string;
  metadata?: Record<string, unknown> | null;
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const base = 1024;
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1);
  const value = bytes / Math.pow(base, idx);
  const decimals = idx === 0 ? 0 : idx === 1 ? 0 : 2;
  return `${value.toFixed(decimals)} ${units[idx]}`;
}

const GUEST_VAULT_PREVIEW_MSG = "خزنة العروض - وضع المعاينة" as const;

const GUEST_VAULT_DEMO_ROWS: VaultRow[] = [
  {
    id: "guest-demo-1",
    filename: "كراسة_شروط_تجريبية_أ.pdf",
    status: "ready",
    created_at: new Date().toISOString(),
    error_message: null,
    storage_path: "guest-preview/demo-1.pdf",
    size_bytes: 1_024_000,
    mime: "application/pdf",
    metadata: { preview: true },
  },
  {
    id: "guest-demo-2",
    filename: "مواصفات_واجهات_تجريبية.docx",
    status: "ready",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
    error_message: null,
    storage_path: "guest-preview/demo-2.docx",
    size_bytes: 512_000,
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    metadata: { preview: true },
  },
  {
    id: "guest-demo-3",
    filename: "ملحق_هندسي_معاينة.pdf",
    status: "pending",
    created_at: new Date(Date.now() - 3_600_000).toISOString(),
    error_message: null,
    storage_path: "guest-preview/demo-3.pdf",
    size_bytes: 2_048_000,
    mime: "application/pdf",
    metadata: { preview: true },
  },
];

function getDocumentDisplayName(row: VaultRow): string {
  const fromColumn = typeof row.filename === "string" ? row.filename.trim() : "";
  if (fromColumn) return fromColumn;
  const metaName =
    typeof row.metadata === "object" && row.metadata
      ? (row.metadata["filename"] ?? row.metadata["original_filename"])
      : null;
  if (typeof metaName === "string" && metaName.trim()) return metaName.trim();
  const path = typeof row.storage_path === "string" ? row.storage_path : "";
  const last = path.split("/").pop() ?? "";
  return last || "—";
}

export default function VaultPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<VaultRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  const [drag, setDrag] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [uid, setUid] = useState<string | null>(null);
  const [storageBytes, setStorageBytes] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [trashBusy, setTrashBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [deletedFlashId, setDeletedFlashId] = useState<string | null>(null);
  const [trashProgress, setTrashProgress] = useState<{ done: number; total: number } | null>(null);
  const reloadTimerRef = useRef<number | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const currentUid = userData.user?.id ?? null;
    setUid(currentUid);
    if (!currentUid) {
      setIsGuest(true);
      setRows(GUEST_VAULT_DEMO_ROWS);
      return;
    }
    setIsGuest(false);
    const { data, error } = await supabase
      .from("vault_documents")
      .select("*")
      .eq("user_id", currentUid)
      .order("created_at", { ascending: false });
    if (!error && data) setRows(data as unknown as VaultRow[]);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const scheduleReload = useCallback(() => {
    if (reloadTimerRef.current) {
      window.clearTimeout(reloadTimerRef.current);
    }
    reloadTimerRef.current = window.setTimeout(() => {
      void load();
    }, 500);
  }, [load]);

  useEffect(() => {
    if (!uid) return;

    const channel = supabase
      .channel(`vault_documents_${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vault_documents",
          filter: `user_id=eq.${uid}`,
        },
        () => scheduleReload()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, uid, scheduleReload]);

  const filteredRows = useMemo(() => {
    return rows.filter(row => 
      getDocumentDisplayName(row).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rows, searchTerm]);

  const failedRows = useMemo(() => rows.filter((r) => r.status === "failed"), [rows]);

  const refreshStats = useCallback(async () => {
    setStatsError(null);
    if (isGuest) {
      const total = GUEST_VAULT_DEMO_ROWS.reduce(
        (sum, r) => sum + (Number.isFinite(r.size_bytes) ? r.size_bytes : 0),
        0,
      );
      setStorageBytes(total);
      return;
    }
    if (!uid) {
      setStorageBytes(0);
      return;
    }
    if (rows.length === 0) {
      setStorageBytes(0);
      return;
    }

    setStatsLoading(true);
    try {
      const buckets = ["vault"] as const;
      const wanted = new Set(rows.map((r) => r.storage_path));
      let total = 0;

      for (const bucket of buckets) {
        let offset = 0;
        const limit = 1000;
        while (true) {
          const { data, error } = await supabase.storage.from(bucket).list(uid, {
            limit,
            offset,
            sortBy: { column: "name", order: "asc" },
          });
          if (error) throw new Error(error.message);
          const files = Array.isArray(data) ? data : [];
          for (const f of files) {
            const name = typeof f.name === "string" ? f.name : "";
            const fullPath = `${uid}/${name}`;
            if (!wanted.has(fullPath)) continue;
            const sizeMaybe =
              (f as unknown as { metadata?: { size?: number | string } }).metadata?.size ??
              (f as unknown as { metadata?: { contentLength?: number | string } }).metadata?.contentLength;
            const size = typeof sizeMaybe === "number" ? sizeMaybe : Number(sizeMaybe ?? 0);
            if (Number.isFinite(size) && size > 0) total += size;
          }
          if (files.length < limit) break;
          offset += limit;
        }
      }

      if (!Number.isFinite(total) || total < 0) total = 0;
      setStorageBytes(total);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "تعذر حساب مساحة التخزين.";
      setStatsError(msg);
      const fallback = rows.reduce((sum, r) => sum + (Number.isFinite(r.size_bytes) ? r.size_bytes : 0), 0);
      setStorageBytes(fallback > 0 ? fallback : 0);
    } finally {
      setStatsLoading(false);
    }
  }, [isGuest, rows, supabase, uid]);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  const emptyTrash = useCallback(async () => {
    if (trashBusy) return;
    if (isGuest) {
      setNotice({ message: GUEST_VAULT_PREVIEW_MSG, type: "info" });
      return;
    }
    if (!uid) {
      setNotice({ message: "انتهت الجلسة. أعِد تسجيل الدخول.", type: "error" });
      return;
    }
    if (failedRows.length === 0) {
      setNotice({ message: "لا توجد ملفات في سلة المحذوفات.", type: "info" });
      return;
    }

    const ok = window.confirm(
      `سيتم حذف ${failedRows.length} ملفاً نهائياً من التخزين وقاعدة البيانات. هل تريد المتابعة؟`
    );
    if (!ok) return;

    setTrashBusy(true);
    setTrashProgress({ done: 0, total: failedRows.length });
    setNotice(null);

    try {
      const paths = failedRows.map((r) => r.storage_path).filter(Boolean);
      const ids = failedRows.map((r) => r.id).filter(Boolean);
      const chunk = <T,>(arr: T[], size: number) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

      let removed = 0;
      for (const batch of chunk(paths, 100)) {
        const { error } = await supabase.storage.from("vault").remove(batch);
        if (error) throw new Error(error.message);
        removed += batch.length;
        setTrashProgress({ done: removed, total: failedRows.length });
      }

      const { error: delErr } = await supabase.from("vault_documents").delete().in("id", ids);
      if (delErr) throw new Error(delErr.message);

      setNotice({ message: "تم تفريغ سلة المحذوفات بنجاح.", type: "success" });
      await load();
      await refreshStats();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "تعذر تفريغ سلة المحذوفات.";
      setNotice({ message: msg, type: "error" });
    } finally {
      setTrashBusy(false);
      setTrashProgress(null);
    }
  }, [failedRows, isGuest, load, refreshStats, supabase, trashBusy, uid]);

  const deleteDocument = useCallback(
    async (row: VaultRow) => {
      if (deleteBusyId) return;
      if (isGuest) {
        setNotice({ message: GUEST_VAULT_PREVIEW_MSG, type: "info" });
        return;
      }
      const docName = getDocumentDisplayName(row);
      const ok = window.confirm(`سيتم حذف المستند "${docName}" نهائياً. هل تريد المتابعة؟`);
      if (!ok) return;

      setDeleteBusyId(row.id);
      setNotice(null);
      const previousRows = rows;
      setRows((prev) => prev.filter((x) => x.id !== row.id));

      try {
        if (row.storage_path) {
          const { error: storageErr } = await supabase.storage.from("vault").remove([row.storage_path]);
          if (storageErr) throw new Error(storageErr.message);
        }

        const { error: dbErr } = await supabase.from("vault_documents").delete().eq("id", row.id);
        if (dbErr) throw new Error(dbErr.message);

        setDeletedFlashId(row.id);
        window.setTimeout(() => setDeletedFlashId(null), 1800);
        setNotice({ message: `تم حذف "${docName}" بنجاح.`, type: "success" });
        await refreshStats();
      } catch (e) {
        setRows(previousRows);
        const msg = e instanceof Error ? e.message : "تعذر حذف المستند.";
        setNotice({ message: msg, type: "error" });
      } finally {
        setDeleteBusyId(null);
      }
    },
    [deleteBusyId, isGuest, refreshStats, rows, supabase]
  );

  async function ingestFile(file: File) {
    setNotice(null);
    if (isGuest) {
      setNotice({ message: `${GUEST_VAULT_PREVIEW_MSG} — يلزم تسجيل الدخول لرفع الملفات.`, type: "info" });
      return;
    }
    const acceptedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!acceptedTypes.includes(file.type)) {
      setNotice({ message: "يُقبل ملفات PDF أو DOCX فقط.", type: "error" });
      return;
    }
    setBusy(true);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const user = userData.user;
    if (userErr || !user) {
      setBusy(false);
      setNotice({ message: "انتهت الجلسة. أعِد تسجيل الدخول.", type: "error" });
      return;
    }
    const ext = file.type === "application/pdf" ? "pdf" : "docx";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("vault").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (upErr) {
      setBusy(false);
      setNotice({ message: upErr.message, type: "error" });
      return;
    }
    const mime =
      file.type ||
      (ext === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const displayName = file.name?.trim() || `document.${ext}`;
    const { data: doc, error: docErr } = await supabase
      .from("vault_documents")
      .insert({
        user_id: user.id,
        filename: displayName,
        storage_path: path,
        mime,
        size_bytes: Number.isFinite(file.size) ? file.size : 0,
        status: "pending",
      })
      .select("id")
      .single();

    if (docErr || !doc) {
      setBusy(false);
      setNotice({
        message: docErr?.message ?? "تعذر حفظ بيانات المستند.",
        type: "error",
      });
      return;
    }
    const res = await fetch("/api/vault/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: doc.id }),
    });
    const payload = (await res.json()) as { error?: string; chunks?: number };
    setBusy(false);
    if (!res.ok) {
      setNotice({ message: payload.error ?? "فشلت المعالجة.", type: "error" });
    } else {
      setNotice({ message: `اكتملت الفهرسة: ${payload.chunks ?? 0} مقطعاً.`, type: "success" });
    }
    await load();
  }

  return (
    <AppShell title="خزنة المستندات">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {isGuest ? (
            <div className="rounded-2xl border border-secondary/30 bg-secondary/5 px-5 py-4 text-sm text-primary">
              <p className="font-bold text-midnight">{GUEST_VAULT_PREVIEW_MSG}</p>
              <p className="mt-1 text-mist">المستندات أدناه للعرض فقط. سجّل الدخول لرفع ومعالجة ملفاتك.</p>
            </div>
          ) : null}
          <div className="bg-surface rounded-[2rem] p-8 shadow-[0_4px_50px_rgba(0,51,52,0.05)]">
            <p className="text-base leading-relaxed text-mist mb-8">
              قم برفع كراسات الشروط والمواصفات (PDF) ليتم تحليلها وفهرستها تلقائياً باستخدام الذكاء الاصطناعي.
            </p>

            <div
              className={`relative flex min-h-[280px] flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed transition-all duration-300 ${
                isGuest
                  ? "cursor-not-allowed border-ghost/60 bg-ghost/20 opacity-80"
                  : `cursor-pointer ${
                      drag
                        ? "border-secondary bg-secondary/8 scale-[0.99]"
                        : "border-ghost bg-surface/80 hover:bg-secondary/5 hover:border-secondary/30"
                    }`
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                if (isGuest) return;
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                if (isGuest) return;
                setDrag(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void ingestFile(f);
              }}
              onClick={() => {
                if (isGuest) {
                  setNotice({ message: `${GUEST_VAULT_PREVIEW_MSG} — يلزم تسجيل الدخول للرفع.`, type: "info" });
                  return;
                }
                document.getElementById("vault-input")?.click();
              }}
            >
              <input
                id="vault-input"
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void ingestFile(f);
                }}
              />
              <div className="flex flex-col items-center text-center px-6">
                <div className={`mb-4 rounded-2xl p-4 transition-colors ${drag ? "bg-primary text-surface" : "bg-surface text-primary shadow-sm"}`}>
                  <FileUp size={32} />
                </div>
                <span className="text-lg font-bold text-midnight">إسقاط PDF أو DOCX هنا أو اختيار ملف</span>
                <span className="mt-2 text-sm text-mist max-w-[240px]">
                  سيتم معالجة الملف وتقسيمه إلى مقاطع ذكية لاستخدامها في العروض
                </span>
              </div>
            </div>

            {notice && (
              <div className={`mt-6 flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
                notice.type === "error" ? "bg-red-50 text-red-700" :
                notice.type === "success" ? "bg-secondary/10 text-secondary" :
                "bg-secondary/8 text-secondary"
              }`}>
                {notice.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                {notice.message}
              </div>
            )}

            {busy && (
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-secondary/8 px-5 py-4">
                <div className="h-5 w-5 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" />
                <span className="text-sm font-bold text-primary">جارٍ الرفع والفهرسة الذكية…</span>
              </div>
            )}
          </div>

          <div className="bg-surface rounded-[2rem] overflow-hidden shadow-[0_4px_50px_rgba(0,51,52,0.05)]">
            <div className="flex items-center justify-between shadow-[0_1px_0_rgba(0,106,103,0.08)] px-8 py-6">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <FileText size={20} className="text-mist" />
                المستندات المؤرشفة
              </h2>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-mist" size={16} />
                <input
                  type="text"
                  placeholder="بحث في المستندات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-full border border-ghost bg-surface px-10 py-2 text-sm outline-none focus:border-secondary/40 focus:bg-white transition-all w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead className="bg-secondary/5 text-mist">
                  <tr>
                    <th className="px-8 py-4 font-semibold text-start">اسم المستند</th>
                    <th className="px-8 py-4 font-semibold text-start">الحالة</th>
                    <th className="px-8 py-4 font-semibold text-start">تاريخ الإضافة</th>
                    <th className="px-8 py-4 font-semibold text-start">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary/8">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-mist">
                          <div className="rounded-full bg-secondary/8 p-4">
                            <FileText size={32} className="opacity-20" />
                          </div>
                          <p className="font-medium">{searchTerm ? "لا توجد نتائج للبحث" : "لا توجد مستندات بعد"}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r) => (
                      <tr
                        key={r.id}
                        className={`group transition-colors ${
                          deletedFlashId === r.id ? "bg-secondary/10" : "hover:bg-secondary/5"
                        }`}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-secondary/10 p-2 group-hover:bg-surface transition-colors">
                              <FileText size={18} className="text-primary" />
                            </div>
                            <span className="font-bold text-primary">{getDocumentDisplayName(r)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            {r.status === "ready" ? (
                              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                <CheckCircle2 size={12} />
                                مكتمل
                              </span>
                            ) : r.status === "failed" ? (
                              <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                                <AlertCircle size={12} />
                                فشل
                              </span>
                            ) : r.status ? (
                              <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                <Clock size={12} className="animate-pulse" />
                                {r.status}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                <Clock size={12} className="animate-pulse" />
                                معالجة
                              </span>
                            )}
                            {r.error_message && (
                              <span className="text-[10px] text-red-500 max-w-[120px] truncate" title={r.error_message}>
                                {r.error_message}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-mist font-medium">
                          {formatUtcTimestamp(r.created_at)}
                        </td>
                        <td className="px-8 py-5">
                          <button
                            type="button"
                            onClick={() => void deleteDocument(r)}
                            disabled={deleteBusyId === r.id}
                            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            title="حذف المستند نهائياً"
                          >
                            <Trash2 size={14} />
                            {deleteBusyId === r.id ? "جارٍ الحذف..." : "حذف"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-primary rounded-[2rem] p-8 text-surface shadow-[0_4px_50px_rgba(0,51,52,0.12)]">
            <h3 className="text-xl font-bold mb-4">إحصائيات الخزنة</h3>
            <div className="space-y-6 mt-8">
              <div className="flex justify-between items-end shadow-[0_1px_0_rgba(247,250,250,0.08)] pb-4">
                <span className="text-sm text-surface/60">إجمالي المستندات</span>
                <span className="text-3xl font-black">{rows.length}</span>
              </div>
              <div className="flex justify-between items-end shadow-[0_1px_0_rgba(247,250,250,0.08)] pb-4">
                <span className="text-sm text-white/60">مساحة التخزين</span>
                <span
                  className="text-lg font-bold"
                  title={
                    rows.length === 0
                      ? "لا توجد مستندات مخزنة حالياً."
                      : statsError
                        ? `تعذر حساب المساحة بدقة من التخزين: ${statsError}`
                        : undefined
                  }
                >
                  {statsLoading ? "جارٍ الحساب…" : formatBytes(storageBytes)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void emptyTrash()}
              disabled={trashBusy || failedRows.length === 0}
              className="w-full mt-8 rounded-2xl bg-white/10 py-3 text-sm font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                failedRows.length === 0
                  ? "لا توجد عناصر لحذفها حالياً."
                  : "يحذف نهائياً المستندات التي فشلت معالجتها."
              }
            >
              <Trash2 size={16} />
              {trashBusy && trashProgress
                ? `جارٍ التفريغ… ${trashProgress.done}/${trashProgress.total}`
                : "تفريغ سلة المحذوفات"}
            </button>
          </div>

          <div className="bg-surface rounded-[2rem] p-8 shadow-[0_4px_50px_rgba(0,51,52,0.05)]">
            <h3 className="text-lg font-bold text-primary mb-4">تعليمات الاستخدام</h3>
            <ul className="space-y-4 text-sm text-mist">
              <li className="flex gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-secondary mt-2 shrink-0" />
                <span>يفضل أن تكون الملفات بصيغة PDF أو DOCX نصية وليست صوراً ممسوحة ضوئياً.</span>
              </li>
              <li className="flex gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-secondary mt-2 shrink-0" />
                <span>يتم تقسيم الملف إلى مقاطع بطول 500 كلمة تقريباً لضمان دقة البحث.</span>
              </li>
              <li className="flex gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-secondary mt-2 shrink-0" />
                <span>المستندات المرفوعة خاصة بك ولا يمكن لأي مستخدم آخر الوصول إليها.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
