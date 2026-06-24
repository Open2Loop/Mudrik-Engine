import { cookies } from "next/headers";
import { MUDRIK_DEMO_COOKIE, MUDRIK_DEMO_VALUE } from "./demo-access-constants";

export { MUDRIK_DEMO_CODE, MUDRIK_DEMO_COOKIE, MUDRIK_DEMO_VALUE } from "./demo-access-constants";

/**
 * True when the HttpOnly demo cookie is present (set by POST /api/auth/demo-unlock).
 */
export async function hasDemoAccessCookieStore(): Promise<boolean> {
  const c = await cookies();
  return c.get(MUDRIK_DEMO_COOKIE)?.value === MUDRIK_DEMO_VALUE;
}

export async function isEngineDemoSession(): Promise<boolean> {
  return hasDemoAccessCookieStore();
}
