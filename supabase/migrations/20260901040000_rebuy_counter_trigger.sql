-- Mantém participations.rebuys_count em sincronia com os eventos de
-- buyins_rebuys via trigger, evitando condição de corrida entre múltiplas
-- requisições concorrentes registrando rebuys da mesma partida.
create function public.handle_new_buyin_rebuy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type = 'rebuy' then
    update public.participations
    set rebuys_count = rebuys_count + 1
    where id = new.participation_id;
  end if;
  return new;
end;
$$;

create trigger on_buyin_rebuy_created
  after insert on public.buyins_rebuys
  for each row execute function public.handle_new_buyin_rebuy();
