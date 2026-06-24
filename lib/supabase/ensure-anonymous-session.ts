import type { SupabaseClient, User } from "@supabase/supabase-js";

let inflight: Promise<User | null> | null = null;

/**
 * Ensures a Supabase session exists — signs in anonymously when none is present.
 * Deduplicates concurrent calls so only one sign-in runs at a time.
 */
export async function ensureAnonymousSession(
  supabase: SupabaseClient,
): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return user;

  if (!inflight) {
    inflight = (async () => {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error("[ensureAnonymousSession]", error.message);
        return null;
      }
      return data.user ?? null;
    })().finally(() => {
      inflight = null;
    });
  }

  return inflight;
}
