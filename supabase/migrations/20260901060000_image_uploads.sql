-- Bucket único para as duas imagens que passam a ser upload de arquivo:
-- avatar do usuário (avatars/{user_id}/avatar) e capa do grupo
-- (groups/{group_id}/cover). Público pra leitura (fotos de perfil/capa
-- não são dado sensível), restrito por dono no caminho pra escrita.

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "images_public_read" on storage.objects for select
  using (bucket_id = 'images');

create policy "images_avatar_owner_write" on storage.objects for insert
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "images_avatar_owner_update" on storage.objects for update
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "images_avatar_owner_delete" on storage.objects for delete
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "images_group_cover_owner_write" on storage.objects for insert
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'groups'
    and public.is_group_owner((storage.foldername(name))[2]::uuid)
  );

create policy "images_group_cover_owner_update" on storage.objects for update
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'groups'
    and public.is_group_owner((storage.foldername(name))[2]::uuid)
  );

create policy "images_group_cover_owner_delete" on storage.objects for delete
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'groups'
    and public.is_group_owner((storage.foldername(name))[2]::uuid)
  );

alter table public.groups add column cover_image_url text;
