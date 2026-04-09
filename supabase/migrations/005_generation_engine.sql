-- Per-user choice for proposal generation: sovereign local (Ollama/Gemma) vs cloud Gemini/OpenAI.
-- Embeddings continue to use ai_provider (gemini | openai) for Smart Vault RAG.

alter table public.user_settings
  add column if not exists generation_engine text not null default 'sovereign';

comment on column public.user_settings.generation_engine is
  'Proposal generation routing: sovereign (local Ollama/Gemma), gemini, openai.';
