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

import { assertEmbeddingVector } from "@/lib/embedding-config";
import { completeGenerationWithRetry, ENGINE_FULL_SYSTEM_PROMPT_AR } from "@/lib/ai-gateway";
import { API_ERROR_UNEXPECTED_AR, API_ERROR_VAULT_RPC_AR, logApiError } from "@/lib/api-errors";
import { embedQuery } from "@/lib/model-gateway";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchUserModelSettings } from "@/lib/user-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Raised for Llama 3.1 70B sequential sections; cap lower on Vercel Hobby if builds fail. */
export const maxDuration = 800;

const RFP_CAP = 24000;
/** Prior sections text cap for anti-repeat prompt (chars). */
const MAX_PRIOR_ANTI_REPEAT = 12000;
/** Per-section relevant vault snippets (keeps prompt focused and faster). */
const SECTION_CONTEXT_BLOCKS = 6;

function cleanGeneratedDraft(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n").trim();
  t = t.replace(/\n{3,}/g, "\n\n");
  t = t.replace(/[ \t]+$/gm, "");
  t = t.replace(/[*#]/g, "");
  return t;
}

/** Removes trailing «notes / instructions / disclaimer» blocks the model may still emit. */
function stripMetaTail(text: string): string {
  const re =
    /(?:^|\n)\s*(?:ملاحظات(?:\s+للمستخدم)?|تعليمات|توجيهات|إخلاء\s*مسؤولية|Disclaimer|Notes\s+for\s+the\s+user|Instructions)\s*[:\uFF1A]?\s*\n[\s\S]*$/i;
  return text.replace(re, "").trim();
}

/** Failsafe: model must not emit bracket placeholders per protocol. */
function stripBracketPlaceholders(text: string): string {
  return text
    .replace(/\[\s*RELEVANT_DATA[^\]]*\]/gi, "")
    .replace(/\[\s*RELEVANT_DATA_REQUIRED\s*\]/gi, "")
    .replace(/\[\s*البيان\s*مطلوب\s*\]/gi, "")
    .replace(/\[\s*cite\s*:\s*[^\]]+\]/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Strips hedging / instruction-like phrases that must not appear in printable output. */
function stripHedgingLeakage(text: string): string {
  return text
    .replace(/\s*عند\s+ورودهما\s+في\s+الوثائق\s*/g, " ")
    .replace(/\s*عند\s+ورودهما\s+في\s+المستندات\s*/g, " ")
    .replace(/التركيز\s+على/g, "")
    .replace(/يرجى\s+تقديم/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Strips echoed internal labels (prompt leakage) from local / cloud output. */
function stripInstructionLeakage(text: string): string {
  let t = text.replace(/\r\n/g, "\n").trim();
  t = t
    .replace(/^\([\d٠-٩]+\/[\d٠-٩]+\)\s*(?:Arabic|≥)[^\n]*\n?/gim, "")
    .replace(/^DRAFT_SECTION[^\n]*\n?/gim, "");
  const badStart =
    /^(التركيز|المطلوب|المنهجية\s+تعتمد\s+على|ملاحظات|تعليمات|Theme|Focus|Coverage|Technical\s+coverage)\s*[:：]?\s*/im;
  const badLine = new RegExp(
    `^(?:التركيز|المطلوب|عنوان\\s+القسم|المحاور|ملاحظات|تعليمات|Theme|Focus)\\s*[:：\\s]`,
    "im",
  );
  for (let k = 0; k < 8; k += 1) {
    const before = t;
    t = t.replace(badStart, "").trim();
    const firstLine = t.split("\n")[0]?.trim() ?? "";
    if (firstLine && badLine.test(firstLine)) {
      t = t.split("\n").slice(1).join("\n").trim();
    }
    if (t === before) break;
  }
  return t.replace(/\[\s*cite\s*:\s*[^\]]+\]/gi, "").trim();
}

/** Removes common chatbot/intro openers (zero-reasoning output). */
function stripLeadingFluff(text: string): string {
  let t = text.replace(/\r\n/g, "\n").trim();
  const patterns: RegExp[] = [
    /^(?:فيما\s+يلي|في\s+ما\s+يلي)[^\n]*\n?/,
    /^(?:وبناءً\s+على|بناءً\s+على\s+طلبكم?)[^\n]*\n?/,
    /^(?:يُعدّ|يعد)\s+(?:هذا|هذه|المشروع|المرحلة|المنهجية)[^\n]*\n?/,
    /^تعتبر\s+(?:هذه|هذا|المرحلة|المنهجية|الخطوة)[^\n]*\n?/,
    /^(?:من\s+المهم\s+الإشارة|من\s+الجدير\s+بالذكر)[^\n]*\n?/,
    /^(?:أود|سأقدم|سوف\s+أستعرض)[^\n]*\n?/,
  ];
  for (let k = 0; k < 6; k += 1) {
    const before = t;
    for (const re of patterns) {
      t = t.replace(re, "").trim();
    }
    if (t === before) break;
  }
  return t;
}

/** True if any 5-word window in `section` appears in `prior` (anti-repetition lock). */
function hasFiveWordOverlap(section: string, prior: string): boolean {
  const tok = (s: string) =>
    s
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
      .split(" ")
      .filter((w) => w.length > 0);
  const pw = tok(prior);
  const sw = tok(section);
  if (pw.length < 5 || sw.length < 5) return false;
  const windows = new Set<string>();
  for (let i = 0; i <= pw.length - 5; i++) {
    windows.add(pw.slice(i, i + 5).join(" "));
  }
  for (let i = 0; i <= sw.length - 5; i++) {
    if (windows.has(sw.slice(i, i + 5).join(" "))) return true;
  }
  return false;
}

/** Drops first line(s) if they duplicate the server section title (no double headers). */
function stripRepeatedSectionTitle(body: string, sectionTitle: string): string {
  let t = body.replace(/\r\n/g, "\n").trim();
  if (!t) return t;
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const target = norm(sectionTitle.trim());
  const leadNum = /^[٠-٩\d]+[\s)\].\-–]+/;
  const stripOnce = (s: string) => norm(s.replace(leadNum, "").trim());
  for (let k = 0; k < 3; k += 1) {
    const lines = t.split("\n");
    const first = lines[0]?.trim() ?? "";
    if (!first) break;
    const firstNorm = norm(first);
    const firstCore = stripOnce(first);
    const targetCore = stripOnce(sectionTitle.trim());
    if (firstNorm === target || firstCore === targetCore) {
      t = lines.slice(1).join("\n").trim();
      continue;
    }
    break;
  }
  return t;
}

function buildSharedContextBlock(excerpt: string, ragContextOneString: string): string {
  const vaultBlock =
    ragContextOneString.trim().length > 0
      ? ragContextOneString
      : "لا يوجد مقاطع مسترجعة من سجل الخبرات في هذه الجلسة؛ التزم بما ورد في كراسة الشروط فقط ولا تخترع مراجع خبرة.";
  return `=== كراسة_شروط_مشروع_المبنى_الذكي.docx — نص المشروع والشروط (الاستشهادات ~٣٨–٧٨ في الملف المنظم) ===\n${excerpt}\n\n=== سجل_خبرات_الشركة.docx — وقائع الخبرة والمشاريع والشهادات والفرق والأدوات (الاستشهادات ~١–٣٧ في الملف المنظم؛ المقاطع أدناه مسترجعة من النظام) ===\n${vaultBlock}`;
}

function tokenizeForScore(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

function selectContextForSection(contextBlocks: string[], focus: string, maxBlocks = SECTION_CONTEXT_BLOCKS): string {
  if (contextBlocks.length <= maxBlocks) {
    return contextBlocks.map((c, i) => `[${i + 1}] ${c}`).join("\n\n---\n\n");
  }

  const focusTokens = new Set(tokenizeForScore(focus));
  const scored = contextBlocks.map((content, idx) => {
    const tokens = tokenizeForScore(content);
    let score = 0;
    for (const t of tokens) {
      if (focusTokens.has(t)) score += 1;
    }
    if (/\b(?:iso|bim|bms|mep|qa|qc|fat|sat|risk|milestone|deliverables|sbc)\b/i.test(content)) {
      score += 2;
    }
    return { idx, content, score };
  });

  const picked = scored
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .slice(0, maxBlocks)
    .sort((a, b) => a.idx - b.idx);

  return picked.map((p, i) => `[${i + 1}] ${p.content}`).join("\n\n---\n\n");
}

const SEQUENTIAL_SECTIONS: { title: string; focus: string }[] = [
  {
    title: "١) نطاق العمل والمتطلبات والامتثال",
    focus:
      "Scope of Work، Compliance، مواءمة SBC/BMS/MEP مع نص الكراسة؛ انقل المدد والدرجات وأرقام البنود كما وردت؛ صياغة المقاول بالمباشر.",
  },
  {
    title: "٢) المنهجية الفنية وأسلوب التنفيذ",
    focus:
      "Method Statement معماري متسلسل: أعمال حفر وأساسات، إنشاء الهيكل الإنشائي، تكامل MEP عمودي وأفقي، تركيب وتجريب BMS والأنظمة الذكية، اختبارات أداء وFAT/SAT، تسليم مراحل؛ BIM والفرق المتوازية؛ مصطلحات من مقاطع الملفات؛ ISO/SBC من النصوص.",
  },
  {
    title: "٣) خطة العمل والجدول الزمني ومراحل التسليم",
    focus:
      "Milestones وDeliverables ودورة المشتريات؛ المدد والتواريخ من الكراسة وسجل الخبرات فقط؛ جداول أو قوائم مرقمة.",
  },
  {
    title: "٤) إدارة المخاطر والحد منها واستمرارية الخدمة",
    focus:
      "Risk Register وتدابير التخفيف واستمرارية التشغيل؛ أمثلة من مشاريع وردت في سجل الخبرات؛ بلا عبارات توجيهية للمقاول من جهة ثالثة.",
  },
];

export async function POST(request: Request) {
  let body: { rfpText?: string; documentId?: string };
  try {
    body = (await request.json()) as { rfpText?: string; documentId?: string };
  } catch {
    return Response.json({ error: "جسم الطلب ليس JSON صالحاً." }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return Response.json({ error: "غير مصرح" }, { status: 401 });
    }
    // System prompt is fixed in ENGINE_FULL_SYSTEM_PROMPT_AR (not accepted from request body).

    let settings;
    try {
      settings = await fetchUserModelSettings(supabase, user.id);
    } catch (e) {
      logApiError("generate/user-settings", e);
      return Response.json(
        { error: "تعذر تحميل إعدادات النماذج. تحقق من الاتصال والمفاتيح." },
        { status: 500 },
      );
    }

    let rfpText = typeof body.rfpText === "string" ? body.rfpText.trim() : "";

    if (!rfpText && body.documentId) {
      const { data: doc } = await supabase
        .from("vault_documents")
        .select("content")
        .eq("id", body.documentId)
        .eq("user_id", user.id)
        .maybeSingle();
      rfpText = typeof doc?.content === "string" ? doc.content.trim() : "";
    }

    if (!rfpText) {
      return Response.json(
        { error: "نص الكراسة مطلوب، أو معرّف مستند صالح يحتوي محتوى." },
        { status: 400 },
      );
    }

    const excerpt = rfpText.length > RFP_CAP ? rfpText.slice(0, RFP_CAP) : rfpText;

    let queryEmbedding: number[];
    try {
      queryEmbedding = await embedQuery(settings, excerpt.slice(0, 8000));
    } catch (e) {
      logApiError("generate/embedQuery", e);
      return Response.json(
        { error: "فشل تجهيز البحث في الخزنة. تحقق من إعدادات التضمين." },
        { status: 500 },
      );
    }

    try {
      assertEmbeddingVector(queryEmbedding, "استعلام التوليد");
    } catch (dimErr) {
      logApiError("generate/embedding-dimension", dimErr);
      return Response.json(
        { error: "بعد المتجه غير متوافق مع الإعدادات. راجع EMBEDDING_VECTOR_DIMENSIONS." },
        { status: 500 },
      );
    }

    const { data: matches, error: rpcErr } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 14,
      min_similarity: 0.18,
    });

    if (rpcErr) {
      logApiError("generate/match_document_chunks", rpcErr);
      return Response.json({ error: API_ERROR_VAULT_RPC_AR }, { status: 500 });
    }

    const rows = Array.isArray(matches) ? matches : [];
    const contextBlocks = rows
      .map((r: { content?: string }) => String(r?.content ?? "").trim())
      .filter(Boolean);

    const fullSystem = ENGINE_FULL_SYSTEM_PROMPT_AR;

    const parts: string[] = [];
    let priorBodies = "";
    for (let i = 0; i < SEQUENTIAL_SECTIONS.length; i += 1) {
      const sec = SEQUENTIAL_SECTIONS[i]!;
      const sectionContext = selectContextForSection(contextBlocks, sec.focus);
      const sharedCtx = buildSharedContextBlock(excerpt, sectionContext);
      const priorBlock =
        priorBodies.length > 0
          ? `\n\n=== أقسام سابقة (ممنوع تكرار أي تسلسل من خمس كلمات متتالية أو أكثر) ===\n${priorBodies.slice(-MAX_PRIOR_ANTI_REPEAT)}\n`
          : "";
      const baseUser = `${sharedCtx}${priorBlock}\n\nDRAFT_SECTION ${i + 1}/${SEQUENTIAL_SECTIONS.length}. Lead-consultant Arabic body only; first char = document. Cross-map tender clauses to ISO + energy track record in prose. Doer voice. No repeat vs prior (5-word lock). Output many long, print-grade technical paragraphs — target maximum substantive depth so the full four sections can approach 30+ printed pages combined.\n\n${sec.focus}`;

      const runOnce = async (suffix: string) =>
        completeGenerationWithRetry(settings, fullSystem, suffix ? `${baseUser}\n\n${suffix}` : baseUser);

      let rawSection: string;
      try {
        rawSection = await runOnce("");
      } catch (e) {
        logApiError(`generate/section:first-attempt:${sec.title}`, e);
        try {
          rawSection = await runOnce(
            "محاولة ثانية تلقائية بعد فشل أول. اختصر السياق الذهني إلى البنود الأعلى صلة وابدأ مباشرة بالنص الفني.",
          );
        } catch (retryErr) {
          logApiError(`generate/section:second-attempt:${sec.title}`, retryErr);
          const msg = retryErr instanceof Error ? retryErr.message : "";
          const timeoutLike = /timeout|مهلة|AbortError|TimeoutError/i.test(msg);
          return Response.json(
            {
              error: timeoutLike
                ? "استغرقت المعالجة وقتاً أطول من المهلة لقسم من المسودة. أعد المحاولة أو قلّل حجم المدخلات."
                : "فشل توليد أحد أقسام المسودة بعد محاولتين. أعد المحاولة أو خفّض حجم النص.",
            },
            { status: 500 },
          );
        }
      }

      let cleaned = cleanGeneratedDraft(rawSection);
      cleaned = stripBracketPlaceholders(cleaned);
      cleaned = stripLeadingFluff(cleaned);
      cleaned = stripHedgingLeakage(cleaned);
      cleaned = stripInstructionLeakage(cleaned);
      cleaned = stripRepeatedSectionTitle(cleaned, sec.title);
      cleaned = stripMetaTail(cleaned);

      if (priorBodies.length > 0 && hasFiveWordOverlap(cleaned, priorBodies)) {
        try {
          rawSection = await runOnce(
            "أعد القسم بالكامل بصياغة جديدة؛ ممنوع أي تسلسل من خمس كلمات متتالية مطابق لما سبق في «أقسام سابقة».",
          );
          cleaned = cleanGeneratedDraft(rawSection);
          cleaned = stripBracketPlaceholders(cleaned);
          cleaned = stripLeadingFluff(cleaned);
          cleaned = stripHedgingLeakage(cleaned);
          cleaned = stripInstructionLeakage(cleaned);
          cleaned = stripRepeatedSectionTitle(cleaned, sec.title);
          cleaned = stripMetaTail(cleaned);
        } catch (e) {
          logApiError(`generate/anti-repeat:${sec.title}`, e);
        }
      }

      priorBodies += `${cleaned}\n\n`;
      parts.push(`${sec.title}\n\n${cleaned}`);
    }

    const draft = parts.join("\n\n");

    return new Response(draft, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Context-Chunks-Used": String(contextBlocks.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logApiError("generate/unexpected", error);
    return Response.json({ error: API_ERROR_UNEXPECTED_AR }, { status: 500 });
  }
}
