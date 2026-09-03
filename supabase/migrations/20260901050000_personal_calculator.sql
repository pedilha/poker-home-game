-- Calculadora pessoal: avulsa, não depende de nenhum grupo, config
-- persistida por usuário (mesmo modelo unidades + valor da unidade
-- usado na config de fichas do grupo).

alter table public.profiles
  add column calculator_unit_value numeric(10, 2) not null default 0.10 check (calculator_unit_value > 0);

create table public.calculator_chip_colors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  color_name text not null,
  color_hex text,
  units int not null check (units > 0),
  sort_order int not null default 0
);

create index calculator_chip_colors_user_id_idx on public.calculator_chip_colors (user_id);

alter table public.calculator_chip_colors enable row level security;

create policy "calculator_chip_colors_owner" on public.calculator_chip_colors for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
