-- Expose settings row metadata + key presence flags without returning API key strings to the client.

create or replace function public.get_user_settings_for_client()
returns table (
  generation_engine text,
  ai_provider text,
  embedding_model text,
  chat_model text,
  has_openai_key boolean,
  has_gemini_key boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    us.generation_engine,
    us.ai_provider,
    us.embedding_model,
    us.chat_model,
    (coalesce(trim(us.model_api_key), '') <> ''),
    (coalesce(trim(us.gemini_api_key), '') <> '')
  from public.user_settings us
  where us.user_id = auth.uid();
$$;

grant execute on function public.get_user_settings_for_client() to authenticated;

comment on function public.get_user_settings_for_client() is
  'Returns user_settings without secret key columns; use for settings UI load.';
