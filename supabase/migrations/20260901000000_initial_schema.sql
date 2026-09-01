-- ============================================================
-- Poker Home Game — schema inicial
-- Entidades: profiles, groups, group_members, group_chip_colors,
-- matches, match_chip_snapshot, participations, declarations,
-- buyins_rebuys, audit_log
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- profiles (espelha auth.users)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  nickname text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- cria o profile automaticamente quando um usuário se cadastra no Supabase Auth
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- groups
-- ------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  entry_code text not null unique,
  owner_id uuid not null references public.profiles (id),
  default_buyin_value numeric(10, 2) not null check (default_buyin_value > 0),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- group_members
-- status 'pending' = solicitou entrada, aguardando aprovação de dono/admin
-- ------------------------------------------------------------
create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_id_idx on public.group_members (user_id);

-- o dono entra automaticamente como membro aprovado ao criar o grupo
create function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role, status)
  values (new.id, new.owner_id, 'owner', 'approved');
  return new;
end;
$$;

create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();

-- ------------------------------------------------------------
-- group_chip_colors — configuração padrão de fichas do grupo
-- editável pelo dono a qualquer momento; nunca retroativo (ver match_chip_snapshot)
-- ------------------------------------------------------------
create table public.group_chip_colors (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  color_name text not null,
  color_hex text,
  chip_count int not null check (chip_count > 0),
  unit_value numeric(10, 2) not null check (unit_value > 0),
  sort_order int not null default 0
);

create index group_chip_colors_group_id_idx on public.group_chip_colors (group_id);

-- ------------------------------------------------------------
-- matches (partidas)
-- ------------------------------------------------------------
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  leader_id uuid not null references public.profiles (id),
  buyin_value numeric(10, 2) not null check (buyin_value > 0),
  status text not null default 'open' check (status in ('open', 'closed')),
  is_divergent boolean not null default false,
  divergence_amount numeric(10, 2),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index matches_group_id_idx on public.matches (group_id);

-- ------------------------------------------------------------
-- match_chip_snapshot — cópia imutável da config de fichas no momento
-- da criação da partida; nunca referencia group_chip_colors depois de criada
-- ------------------------------------------------------------
create table public.match_chip_snapshot (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  color_name text not null,
  color_hex text,
  unit_value numeric(10, 2) not null check (unit_value > 0),
  sort_order int not null default 0
);

create index match_chip_snapshot_match_id_idx on public.match_chip_snapshot (match_id);

-- ------------------------------------------------------------
-- participations (jogador em uma partida)
-- ------------------------------------------------------------
create table public.participations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  status text not null default 'playing' check (status in ('playing', 'cashed_out', 'pending')),
  rebuys_count int not null default 0 check (rebuys_count >= 0),
  declared_amount numeric(10, 2),
  declared_at timestamptz,
  created_at timestamptz not null default now(),
  unique (match_id, user_id)
);

create index participations_match_id_idx on public.participations (match_id);
create index participations_user_id_idx on public.participations (user_id);

-- ------------------------------------------------------------
-- declarations — quantidade de fichas por cor declarada por participação
-- ------------------------------------------------------------
create table public.declarations (
  id uuid primary key default gen_random_uuid(),
  participation_id uuid not null references public.participations (id) on delete cascade,
  match_chip_snapshot_id uuid not null references public.match_chip_snapshot (id) on delete cascade,
  chip_count int not null check (chip_count >= 0),
  unique (participation_id, match_chip_snapshot_id)
);

create index declarations_participation_id_idx on public.declarations (participation_id);

-- ------------------------------------------------------------
-- buyins_rebuys — cada buy-in/rebuy é 1 stack (unidade fixa = buyin_value da partida)
-- ------------------------------------------------------------
create table public.buyins_rebuys (
  id uuid primary key default gen_random_uuid(),
  participation_id uuid not null references public.participations (id) on delete cascade,
  type text not null check (type in ('buy_in', 'rebuy')),
  amount numeric(10, 2) not null check (amount > 0),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index buyins_rebuys_participation_id_idx on public.buyins_rebuys (participation_id);

-- ------------------------------------------------------------
-- audit_log — toda intervenção do líder (edições, resets, correções)
-- ------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  actor_id uuid not null references public.profiles (id),
  action text not null,
  target_participation_id uuid references public.participations (id),
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_match_id_idx on public.audit_log (match_id);

-- ============================================================
-- Funções auxiliares para RLS (security definer para evitar
-- recursão ao consultar as próprias tabelas protegidas por RLS)
-- ============================================================

create function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and status = 'approved'
  );
$$;

create function public.is_group_admin(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
      and status = 'approved' and role in ('owner', 'admin')
  );
$$;

create function public.is_group_owner(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.groups where id = p_group_id and owner_id = auth.uid()
  );
$$;

create function public.is_match_leader(p_match_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.matches where id = p_match_id and leader_id = auth.uid()
  );
$$;

create function public.match_group_id(p_match_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select group_id from public.matches where id = p_match_id;
$$;

create function public.participation_match_id(p_participation_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select match_id from public.participations where id = p_participation_id;
$$;

create function public.participation_owner(p_participation_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select user_id from public.participations where id = p_participation_id;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_chip_colors enable row level security;
alter table public.matches enable row level security;
alter table public.match_chip_snapshot enable row level security;
alter table public.participations enable row level security;
alter table public.declarations enable row level security;
alter table public.buyins_rebuys enable row level security;
alter table public.audit_log enable row level security;

-- profiles: o próprio usuário sempre vê/edita o seu; demais membros de um
-- grupo em comum veem o perfil uns dos outros (nome/apelido/foto)
create policy "profiles_select" on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid() and gm1.status = 'approved'
        and gm2.user_id = profiles.id and gm2.status = 'approved'
    )
  );
create policy "profiles_insert_self" on public.profiles for insert
  with check (id = auth.uid());
create policy "profiles_update_self" on public.profiles for update
  using (id = auth.uid());

-- groups
create policy "groups_select_member" on public.groups for select
  using (public.is_group_member(id) or owner_id = auth.uid());
create policy "groups_insert_owner" on public.groups for insert
  with check (owner_id = auth.uid());
create policy "groups_update_owner" on public.groups for update
  using (owner_id = auth.uid());

-- group_members: membro aprovado vê a lista; qualquer usuário autenticado
-- pode criar sua própria solicitação pendente; dono/admin aprova e gerencia
create policy "group_members_select" on public.group_members for select
  using (
    public.is_group_member(group_id) or public.is_group_admin(group_id) or user_id = auth.uid()
  );
create policy "group_members_insert_self_request" on public.group_members for insert
  with check (user_id = auth.uid() and role = 'member' and status = 'pending');
create policy "group_members_insert_admin" on public.group_members for insert
  with check (public.is_group_admin(group_id));
create policy "group_members_update_admin" on public.group_members for update
  using (public.is_group_admin(group_id));
create policy "group_members_delete_admin_or_self" on public.group_members for delete
  using (public.is_group_admin(group_id) or user_id = auth.uid());

-- group_chip_colors: membros leem, só o dono edita
create policy "chip_colors_select_member" on public.group_chip_colors for select
  using (public.is_group_member(group_id));
create policy "chip_colors_write_owner" on public.group_chip_colors for all
  using (public.is_group_owner(group_id))
  with check (public.is_group_owner(group_id));

-- matches: membros leem; qualquer membro cria (vira líder); só o líder edita
create policy "matches_select_member" on public.matches for select
  using (public.is_group_member(group_id));
create policy "matches_insert_member" on public.matches for insert
  with check (public.is_group_member(group_id) and leader_id = auth.uid());
create policy "matches_update_leader" on public.matches for update
  using (leader_id = auth.uid());

-- match_chip_snapshot: membros do grupo leem; só o líder escreve
create policy "snapshot_select_member" on public.match_chip_snapshot for select
  using (public.is_group_member(public.match_group_id(match_id)));
create policy "snapshot_write_leader" on public.match_chip_snapshot for all
  using (public.is_match_leader(match_id))
  with check (public.is_match_leader(match_id));

-- participations: membros do grupo leem; líder cria; líder ou o próprio
-- jogador atualiza seu status/declaração (ex: cash-out)
create policy "participations_select_member" on public.participations for select
  using (public.is_group_member(public.match_group_id(match_id)));
create policy "participations_insert_leader" on public.participations for insert
  with check (public.is_match_leader(match_id));
create policy "participations_update_leader_or_self" on public.participations for update
  using (public.is_match_leader(match_id) or user_id = auth.uid());

-- declarations: membros do grupo leem; líder ou o dono da participação escreve
create policy "declarations_select_member" on public.declarations for select
  using (public.is_group_member(public.match_group_id(public.participation_match_id(participation_id))));
create policy "declarations_write_leader_or_self" on public.declarations for all
  using (
    public.is_match_leader(public.participation_match_id(participation_id))
    or public.participation_owner(participation_id) = auth.uid()
  )
  with check (
    public.is_match_leader(public.participation_match_id(participation_id))
    or public.participation_owner(participation_id) = auth.uid()
  );

-- buyins_rebuys: membros do grupo leem; só o líder registra (custodia física do dinheiro)
create policy "buyins_select_member" on public.buyins_rebuys for select
  using (public.is_group_member(public.match_group_id(public.participation_match_id(participation_id))));
create policy "buyins_write_leader" on public.buyins_rebuys for all
  using (public.is_match_leader(public.participation_match_id(participation_id)))
  with check (public.is_match_leader(public.participation_match_id(participation_id)));

-- audit_log: membros do grupo leem (histórico); só o líder da partida registra
create policy "audit_select_member" on public.audit_log for select
  using (public.is_group_member(public.match_group_id(match_id)));
create policy "audit_insert_leader" on public.audit_log for insert
  with check (public.is_match_leader(match_id) and actor_id = auth.uid());
