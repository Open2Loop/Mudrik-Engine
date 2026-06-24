/**
 * Saved technical proposals. Reads `NEXT_PUBLIC_SUPABASE_PROPOSALS_TABLE`, defaulting to `proposals`
 * (see migrations 007/008). Override in `.env` if your project uses a different table name.
 */
const raw = process.env.NEXT_PUBLIC_SUPABASE_PROPOSALS_TABLE;
export const PROPOSALS_TABLE = (raw && String(raw).trim()) || "proposals";
