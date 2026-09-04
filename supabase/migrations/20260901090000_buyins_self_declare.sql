-- O cálculo de fichas (incluindo rebuys) agora é feito pelo próprio jogador
-- na hora de declarar o resultado, e não mais registrado pelo líder clique a
-- clique durante a partida. A escrita em buyins_rebuys passa a ser permitida
-- para o líder OU o dono da participação, no mesmo padrão já usado em
-- declarations_write_leader_or_self. O líder mantém a possibilidade de
-- editar o cálculo de qualquer jogador.
drop policy "buyins_write_leader" on public.buyins_rebuys;

create policy "buyins_write_leader_or_self" on public.buyins_rebuys for all
  using (
    public.is_match_leader(public.participation_match_id(participation_id))
    or public.participation_owner(participation_id) = auth.uid()
  )
  with check (
    public.is_match_leader(public.participation_match_id(participation_id))
    or public.participation_owner(participation_id) = auth.uid()
  );
