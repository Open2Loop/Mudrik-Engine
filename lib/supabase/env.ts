const SUPABASE_URL_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"] as const;
const SUPABASE_KEY_KEYS = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
] as const;

function firstEnv(keys: readonly string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) return value.trim();
  }
  return "";
}

export function getSupabaseServerEnv() {
  const url = firstEnv(SUPABASE_URL_KEYS);
  const key = firstEnv(SUPABASE_KEY_KEYS);
  return { url, key };
}

export function getSupabaseClientEnv() {
  const url = firstEnv(["NEXT_PUBLIC_SUPABASE_URL"]);
  const key = firstEnv(["NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]);
  return { url, key };
}

export function getSupabaseEnvMissingMessage() {
  return (
    "إعدادات Supabase غير مكتملة. " +
    `URL: ${SUPABASE_URL_KEYS.join(" أو ")} | KEY: ${SUPABASE_KEY_KEYS.join(" أو ")}`
  );
}
