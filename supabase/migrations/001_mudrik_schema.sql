-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- User settings (BYOK and model identifiers)
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ai_provider text default 'gemini',
  model_api_key text,
  gemini_api_key text,
  embedding_model text default 'text-embedding-3-small',
  chat_model text default 'gpt-4o-mini',
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Users manage own settings"
  on public.user_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Vault document metadata
create table if not exists public.vault_documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  filename text not null,
  storage_path text not null,
  mime text not null default 'application/pdf',
  size_bytes bigint not null default 0,
  status text not null default 'pending',
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists vault_documents_user_idx on public.vault_documents (user_id);

alter table public.vault_documents add column if not exists content text not null default '';

alter table public.vault_documents enable row level security;

create policy "Users read own vault docs"
  on public.vault_documents
  for select
  using (auth.uid() = user_id);

create policy "Users insert own vault docs"
  on public.vault_documents
  for insert
  with check (auth.uid() = user_id);

create policy "Users update own vault docs"
  on public.vault_documents
  for update
  using (auth.uid() = user_id);

create policy "Users delete own vault docs"
  on public.vault_documents
  for delete
  using (auth.uid() = user_id);

-- Chunked embeddings for RAG
create table if not exists public.document_chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.vault_documents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  chunk_index int not null,
  content text not null,
  token_estimate int not null default 0,
  embedding vector(3072) not null
);

create index if not exists document_chunks_document_idx on public.document_chunks (document_id);
create index if not exists document_chunks_user_idx on public.document_chunks (user_id);

alter table public.document_chunks enable row level security;

create policy "Users read own chunks"
  on public.document_chunks
  for select
  using (auth.uid() = user_id);

create policy "Users insert own chunks"
  on public.document_chunks
  for insert
  with check (auth.uid() = user_id);

create policy "Users delete own chunks"
  on public.document_chunks
  for delete
  using (auth.uid() = user_id);

-- Similarity search (cosine); scoped to the caller via auth.uid()
create or replace function public.match_document_chunks (
  query_embedding float8[],
  match_count int default 12,
  min_similarity float default 0.22
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chunk_index int,
  similarity float
)
language sql stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding::vector(3072)) as similarity
  from public.document_chunks dc
  where dc.user_id = auth.uid()
    and 1 - (dc.embedding <=> query_embedding::vector(3072)) >= min_similarity
  order by dc.embedding <=> query_embedding::vector(3072)
  limit match_count;
$$;

grant execute on function public.match_document_chunks(float8[], int, float) to authenticated;

-- Storage: create bucket "vault" in Dashboard and policies:
-- Allow authenticated users to upload/read/delete under folder matching their user id.
