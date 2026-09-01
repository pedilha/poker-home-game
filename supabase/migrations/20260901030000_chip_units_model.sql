-- Correção de modelo: cada cor vale um número de "unidades" (denominação,
-- ex: branca=1un, vermelha=5un), e existe um único "valor da unidade" (R$)
-- por config — não um valor monetário direto por cor. Facilita reprecificar
-- o set inteiro trocando um número só.

alter table public.groups
  add column chip_unit_value numeric(10, 2) not null default 0.10 check (chip_unit_value > 0);

alter table public.group_chip_colors
  drop column chip_count,
  drop column unit_value,
  add column units int not null default 1 check (units > 0);

-- snapshot imutável por partida precisa do mesmo par (unidades da cor + valor
-- da unidade), já que o valor da unidade também pode mudar no grupo depois
alter table public.matches
  add column chip_unit_value numeric(10, 2) not null default 0.10 check (chip_unit_value > 0);

alter table public.match_chip_snapshot
  drop column unit_value,
  add column units int not null default 1 check (units > 0);
