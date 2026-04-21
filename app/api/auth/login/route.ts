/**
 * Server-side login: writes Supabase session cookies on the response so
 * middleware and RSC see the same session (fixes client-only sign-in gaps on some browsers / webviews).
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnvMissingMessage, getSupabaseServerEnv } from "@/lib/supabase/env";

export async function POST(request: NextRequest) {
  const { url: supabaseUrl, key: supabaseKey } = getSupabaseServerEnv();
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: getSupabaseEnvMissingMessage() }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "جسم الطلب غير صالح." }, { status: 400 });
  }

  const email =
    typeof body === "object" && body !== null && "email" in body && typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim()
      : "";
  const password =
    typeof body === "object" && body !== null && "password" in body && typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!email || !password) {
    return NextResponse.json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان." }, { status: 400 });
  }

  const jsonOk = NextResponse.json({ ok: true as const });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          jsonOk.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return jsonOk;
}
