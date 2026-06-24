"use client";

import { useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureAnonymousSession } from "@/lib/supabase/ensure-anonymous-session";

/** Kicks off anonymous Supabase sign-in on first client load when no session exists. */
export function AnonymousSessionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    void ensureAnonymousSession(supabase);
  }, []);

  return <>{children}</>;
}
