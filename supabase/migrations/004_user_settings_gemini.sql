alter table public.user_settings add column if not exists ai_provider text default 'gemini';
alter table public.user_settings add column if not exists gemini_api_key text;
