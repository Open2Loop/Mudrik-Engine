import { NextResponse } from "next/server";
import { API_ERROR_UNEXPECTED_AR, logApiError } from "@/lib/api-errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalyzeUrlBody = {
  url?: string;
};

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHttpUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProtocol);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    let body: AnalyzeUrlBody;
    try {
      body = (await request.json()) as AnalyzeUrlBody;
    } catch {
      return NextResponse.json({ error: "تنسيق الطلب غير صالح." }, { status: 400 });
    }

    const normalizedUrl = normalizeHttpUrl(body.url ?? "");
    if (!normalizedUrl) {
      return NextResponse.json({ error: "الرابط غير صالح. استخدم رابط HTTP أو HTTPS." }, { status: 400 });
    }

    let res: Response;
    try {
      res = await fetch(normalizedUrl, {
        method: "GET",
        headers: {
          "User-Agent": "MudrikBot/1.0 (+https://mudrik.local)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });
    } catch {
      return NextResponse.json({ error: "تعذر الوصول إلى الرابط. تحقق من الشبكة أو عنوان الموقع." }, { status: 502 });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `فشل تحميل الصفحة (${res.status}). تأكد أن الرابط متاح بدون تسجيل دخول.` },
        { status: 502 },
      );
    }

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ error: "الرابط لا يشير إلى صفحة HTML قابلة للتحليل." }, { status: 400 });
    }

    const html = await res.text();
    const text = extractTextFromHtml(html);
    if (!text) {
      return NextResponse.json({ error: "لم يتم استخراج نص قابل للاستخدام من الصفحة." }, { status: 422 });
    }

    return NextResponse.json({
      ok: true,
      source: "url",
      url: normalizedUrl,
      charCount: text.length,
      text,
    });
  } catch (e) {
    logApiError("company-profile/analyze", e);
    return NextResponse.json({ error: API_ERROR_UNEXPECTED_AR }, { status: 500 });
  }
}

