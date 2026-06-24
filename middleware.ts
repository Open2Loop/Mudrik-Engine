import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

/** API routes usable without a Supabase session (open platform + engine + exports). */
function isPublicApiPath(path: string): boolean {
  if (path.startsWith("/api/auth/")) return true;
  if (path === "/api/ai" || path.startsWith("/api/ai/")) return true;
  if (path === "/api/clean-generate") return true;
  if (path.startsWith("/api/engine/")) return true;
  if (path.startsWith("/api/export/")) return true;
  if (path.startsWith("/api/company-profile/")) return true;
  if (path.startsWith("/api/agents/")) return true;
  if (path.startsWith("/api/proposal/")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user: User | null = null;

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  } else {
    console.warn(
      "[munakasa] Middleware: Supabase env vars missing; requests proceed without session.",
    );
  }

  const path = request.nextUrl.pathname;

  if (!user && path.startsWith("/api") && !isPublicApiPath(path)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  if (user && path === "/login") {
    return NextResponse.redirect(new URL("/command-center", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
