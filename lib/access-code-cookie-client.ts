import { MUDRIK_DEMO_CODE, MUDRIK_GUEST_ACCESS_COOKIE_NAME } from "@/lib/demo-access-constants";

const GUEST_MAX_AGE_SEC = 60 * 60 * 24 * 7;

/** Persist guest bypass cookie so middleware can read it on the next request. */
export function setGuestAccessCodeCookie(): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${MUDRIK_GUEST_ACCESS_COOKIE_NAME}=${MUDRIK_DEMO_CODE}; path=/; max-age=${GUEST_MAX_AGE_SEC}; SameSite=Lax`;
  } catch {
    // quota / private mode
  }
}

export function hasGuestAccessCodeCookie(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const part = `; ${document.cookie}`.match(
      new RegExp(`;\\s*${MUDRIK_GUEST_ACCESS_COOKIE_NAME}=([^;]*)`),
    );
    if (!part?.[1]) return false;
    return decodeURIComponent(part[1].trim()) === MUDRIK_DEMO_CODE;
  } catch {
    return false;
  }
}
