/**
 * Shared strings for the Vision 2030 public demo (no auth).
 * Kept free of `next/headers` so `middleware` can import safely.
 */
export const MUDRIK_DEMO_COOKIE = "mudrik_demo_access" as const;
export const MUDRIK_DEMO_VALUE = "1" as const;
export const MUDRIK_DEMO_CODE = "2030" as const;

/** Readable by middleware and `document.cookie` — unlocks /settings, /vault, /archive for guests. */
export const MUDRIK_GUEST_ACCESS_COOKIE_NAME = "access_code" as const;

/** Parallel to VIP flag — read by the engine to switch to `/api/clean-generate`. */
export const MUDRIK_ACCESS_CODE_STORAGE_KEY = "access_code" as const;

/** Client-only flag: set on successful 2030 unlock (`vip_2030`). */
export const MUDRIK_GUEST_SESSION_KEY = "mudrik_guest_session" as const;
export const MUDRIK_GUEST_SESSION_VIP_2030 = "vip_2030" as const;

/** Shown when a guest tries to use Supabase-persisted features (archive, cloud profile). */
export const MUDRIK_GUEST_PREMIUM_FEATURE_TOAST =
  "عذراً، هذه الميزة تتطلب تسجيل الدخول ببريد إلكتروني معتمد لحفظ بياناتك بأمان." as const;
