import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

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
      "[mudrik] Middleware: NEXT_PUBLIC_SUPABASE_URL أو NEXT_PUBLIC_SUPABASE_ANON_KEY غير معرّفين؛ تُعامل الطلبات كغير مصادق عليها."
    );
  }

  const path = request.nextUrl.pathname;
  if (!user && path.startsWith("/api")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  if (!user && path !== "/login" && path !== "/") {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    return redirect;
  }

  if (user && path === "/login") {
    return NextResponse.redirect(new URL("/vault", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
