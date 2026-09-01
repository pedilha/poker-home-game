-- Um usuário que solicitou entrada (status 'pending') precisa conseguir ver o
-- nome do grupo antes de ser aprovado, então a visibilidade de `groups` passa
-- a valer para qualquer linha em group_members (pendente ou aprovada), não só aprovada.
drop policy "groups_select_member" on public.groups;

create policy "groups_select_member" on public.groups for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.group_members
      where group_id = groups.id and user_id = auth.uid()
    )
  );

-- Permite localizar um grupo pelo código de entrada sem expor a tabela
-- inteira via select direto (evita enumeração de grupos por quem não é membro).
create function public.find_group_by_entry_code(p_entry_code text)
returns table (id uuid, name text)
language sql
security definer
stable
set search_path = public
as $$
  select id, name from public.groups where entry_code = p_entry_code;
$$;

revoke all on function public.find_group_by_entry_code(text) from public;
grant execute on function public.find_group_by_entry_code(text) to authenticated;
