import {
  MUDRIK_ACCESS_CODE_STORAGE_KEY,
  MUDRIK_DEMO_CODE,
  MUDRIK_GUEST_SESSION_KEY,
  MUDRIK_GUEST_SESSION_VIP_2030,
} from "@/lib/demo-access-constants";

/** True if there is no Supabase user and the device has a VIP 2030 guest session flag. */
export function isGuestVipGating(
  user: { id: string } | null | undefined,
): boolean {
  if (user) return false;
  return readGuestVipFromStorage();
}

export function readGuestVipFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUDRIK_GUEST_SESSION_KEY) === MUDRIK_GUEST_SESSION_VIP_2030;
  } catch {
    return false;
  }
}

/**
 * Backfill `access_code` for clients that had `vip_2030` before the clean-generate path existed.
 */
export function ensureAccessCodeForLegacyVip(): void {
  if (typeof window === "undefined") return;
  try {
    if (
      window.localStorage.getItem(MUDRIK_GUEST_SESSION_KEY) === MUDRIK_GUEST_SESSION_VIP_2030 &&
      window.localStorage.getItem(MUDRIK_ACCESS_CODE_STORAGE_KEY) !== MUDRIK_DEMO_CODE
    ) {
      window.localStorage.setItem(MUDRIK_ACCESS_CODE_STORAGE_KEY, MUDRIK_DEMO_CODE);
    }
  } catch {
    // private mode / quota
  }
}

/**
 * `!user` and demo access code `2030` — use `/api/clean-generate` instead of `/api/engine/generate`.
 */
export function isAccessCodeEngineUser(user: { id: string } | null | undefined): boolean {
  if (user) return false;
  if (typeof window === "undefined") return false;
  try {
    ensureAccessCodeForLegacyVip();
    return window.localStorage.getItem(MUDRIK_ACCESS_CODE_STORAGE_KEY) === MUDRIK_DEMO_CODE;
  } catch {
    return false;
  }
}

/** Re-issues the HttpOnly demo cookie in production if localStorage still marks a VIP guest. */
export function refreshVipDemoCookieIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (!readGuestVipFromStorage()) return;
  void fetch("/api/auth/demo-unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: MUDRIK_DEMO_CODE }),
  }).catch(() => {});
}
