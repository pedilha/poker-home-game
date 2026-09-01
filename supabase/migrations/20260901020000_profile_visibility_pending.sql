-- Dono/admin precisam ver o nome de quem solicitou entrada (status 'pending')
-- para decidir se aprovam, então a visibilidade de profiles entre membros de
-- um mesmo grupo deixa de exigir status 'approved' do lado observado.
drop policy "profiles_select" on public.profiles;

create policy "profiles_select" on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid() and gm1.status = 'approved'
        and gm2.user_id = profiles.id
    )
  );
