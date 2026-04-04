insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vault',
  'vault',
  false,
  52428800,
  array['application/pdf']::text[]
)
on conflict (id) do nothing;

drop policy if exists "vault_select_own" on storage.objects;
drop policy if exists "vault_insert_own" on storage.objects;
drop policy if exists "vault_update_own" on storage.objects;
drop policy if exists "vault_delete_own" on storage.objects;

create policy "vault_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "vault_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "vault_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "vault_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);
