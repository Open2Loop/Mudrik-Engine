/* 
  MUDRIK PROJECT: COMPREHENSIVE INFRASTRUCTURE SETUP
  This script ensures the Supabase database and storage are correctly configured.
  It handles bucket creation, table schema updates, and permissions.
*/

-- 1. STORAGE INFRASTRUCTURE
-- Ensure the 'vault' bucket exists and supports both PDF and DOCX
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vault',
  'vault',
  false, -- Private bucket, access controlled by RLS
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[];

-- 2. STORAGE POLICIES (RLS)
-- Ensure users can only access their own folders in the vault bucket
DO $$
BEGIN
    DROP POLICY IF EXISTS "vault_select_own" ON storage.objects;
    DROP POLICY IF EXISTS "vault_insert_own" ON storage.objects;
    DROP POLICY IF EXISTS "vault_update_own" ON storage.objects;
    DROP POLICY IF EXISTS "vault_delete_own" ON storage.objects;
END $$;

CREATE POLICY "vault_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "vault_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "vault_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "vault_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);


-- 3. DATABASE SCHEMA UPDATES
-- Ensure 'user_settings' table has all required columns
DO $$
BEGIN
    -- Add model_api_key if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'model_api_key') THEN
        ALTER TABLE public.user_settings ADD COLUMN model_api_key TEXT;
    END IF;

    -- Add embedding_model if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'embedding_model') THEN
        ALTER TABLE public.user_settings ADD COLUMN embedding_model TEXT DEFAULT 'text-embedding-3-small';
    END IF;

    -- Add chat_model if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'chat_model') THEN
        ALTER TABLE public.user_settings ADD COLUMN chat_model TEXT DEFAULT 'gpt-4o-mini';
    END IF;

    -- Ensure updated_at exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'updated_at') THEN
        ALTER TABLE public.user_settings ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;


-- 4. TABLE PERMISSIONS
-- Ensure RLS is enabled and policies are active for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users manage own settings" ON public.user_settings;
END $$;

CREATE POLICY "Users manage own settings"
  ON public.user_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. VAULT DOCUMENTS UPDATES
-- Ensure mime type column can handle docx
ALTER TABLE public.vault_documents ALTER COLUMN mime SET DEFAULT 'application/pdf';
-- Add flexible content column for direct-context generation
ALTER TABLE public.vault_documents ADD COLUMN IF NOT EXISTS content text;
UPDATE public.vault_documents SET content = '' WHERE content IS NULL;
ALTER TABLE public.vault_documents ALTER COLUMN content SET DEFAULT '';
ALTER TABLE public.vault_documents ALTER COLUMN content SET NOT NULL;

-- Comments for clarity
COMMENT ON TABLE public.user_settings IS 'Stores per-user AI model configurations and API keys (BYOK).';
COMMENT ON COLUMN public.user_settings.chat_model IS 'The identifier for the chat/generation model (e.g., gpt-4o-mini).';
COMMENT ON COLUMN public.user_settings.embedding_model IS 'The identifier for the embedding model (e.g., text-embedding-3-small).';

ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS ai_provider text DEFAULT 'gemini';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS gemini_api_key text;
