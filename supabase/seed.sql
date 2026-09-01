-- Dados de teste para desenvolvimento local (supabase start).
-- Login de qualquer usuário abaixo: senha "password123".

do $$
declare
  v_pedro uuid := '11111111-1111-1111-1111-111111111111';
  v_tarcisio uuid := '22222222-2222-2222-2222-222222222222';
  v_chris uuid := '33333333-3333-3333-3333-333333333333';
  v_vitor uuid := '44444444-4444-4444-4444-444444444444';
  v_group uuid;
  v_match uuid;
  v_white uuid;
  v_red uuid;
  v_blue uuid;
  v_green uuid;
  v_p_pedro uuid;
  v_p_tarcisio uuid;
  v_p_chris uuid;
  v_p_vitor uuid;
begin
  -- usuários (o trigger on_auth_user_created cria o profile de cada um)
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) values
    ('00000000-0000-0000-0000-000000000000', v_pedro, 'authenticated', 'authenticated', 'pedro@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Pedro"}'),
    ('00000000-0000-0000-0000-000000000000', v_tarcisio, 'authenticated', 'authenticated', 'tarcisio@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tarcísio"}'),
    ('00000000-0000-0000-0000-000000000000', v_chris, 'authenticated', 'authenticated', 'chris@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Chris"}'),
    ('00000000-0000-0000-0000-000000000000', v_vitor, 'authenticated', 'authenticated', 'vitor@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Vitor"}');

  -- grupo (o trigger on_group_created já aprova o Pedro como owner em group_members)
  insert into public.groups (name, entry_code, owner_id, default_buyin_value)
  values ('Sexta do Pedro', 'SEXTA01', v_pedro, 50.00)
  returning id into v_group;

  insert into public.group_members (group_id, user_id, role, status) values
    (v_group, v_tarcisio, 'member', 'approved'),
    (v_group, v_chris, 'member', 'approved'),
    (v_group, v_vitor, 'member', 'approved');

  insert into public.group_chip_colors (group_id, color_name, color_hex, chip_count, unit_value, sort_order) values
    (v_group, 'Branca', '#f5f5f5', 100, 0.40, 1),
    (v_group, 'Vermelha', '#dc2626', 60, 1.00, 2),
    (v_group, 'Azul', '#2563eb', 40, 5.00, 3),
    (v_group, 'Verde', '#16a34a', 20, 25.00, 4);

  -- partida fechada, com divergência proposital (para exercitar o fluxo de conciliação)
  insert into public.matches (group_id, leader_id, buyin_value, status, is_divergent, divergence_amount, created_at, closed_at)
  values (v_group, v_pedro, 50.00, 'closed', true, 55.00, now() - interval '2 hours', now())
  returning id into v_match;

  insert into public.match_chip_snapshot (match_id, color_name, color_hex, unit_value, sort_order) values
    (v_match, 'Branca', '#f5f5f5', 0.40, 1),
    (v_match, 'Vermelha', '#dc2626', 1.00, 2),
    (v_match, 'Azul', '#2563eb', 5.00, 3),
    (v_match, 'Verde', '#16a34a', 25.00, 4);

  select id into v_white from public.match_chip_snapshot where match_id = v_match and color_name = 'Branca';
  select id into v_red from public.match_chip_snapshot where match_id = v_match and color_name = 'Vermelha';
  select id into v_blue from public.match_chip_snapshot where match_id = v_match and color_name = 'Azul';
  select id into v_green from public.match_chip_snapshot where match_id = v_match and color_name = 'Verde';

  insert into public.participations (match_id, user_id, status, rebuys_count, declared_amount, declared_at) values
    (v_match, v_pedro, 'cashed_out', 2, 210.00, now()) returning id into v_p_pedro;
  insert into public.participations (match_id, user_id, status, rebuys_count, declared_amount, declared_at) values
    (v_match, v_tarcisio, 'cashed_out', 1, 90.00, now()) returning id into v_p_tarcisio;
  insert into public.participations (match_id, user_id, status, rebuys_count, declared_amount, declared_at) values
    (v_match, v_chris, 'cashed_out', 0, 40.00, now()) returning id into v_p_chris;
  insert into public.participations (match_id, user_id, status, rebuys_count, declared_amount, declared_at) values
    (v_match, v_vitor, 'cashed_out', 1, 115.00, now()) returning id into v_p_vitor;

  insert into public.buyins_rebuys (participation_id, type, amount, created_by) values
    (v_p_pedro, 'buy_in', 50.00, v_pedro),
    (v_p_pedro, 'rebuy', 50.00, v_pedro),
    (v_p_pedro, 'rebuy', 50.00, v_pedro),
    (v_p_tarcisio, 'buy_in', 50.00, v_pedro),
    (v_p_tarcisio, 'rebuy', 50.00, v_pedro),
    (v_p_chris, 'buy_in', 50.00, v_pedro),
    (v_p_vitor, 'buy_in', 50.00, v_pedro),
    (v_p_vitor, 'rebuy', 50.00, v_pedro);

  -- Pedro: green*8 + red*10 = 210 | Tarcísio: green*3 + blue*3 = 90
  -- Chris: blue*8 = 40           | Vitor: green*4 + blue*3 = 115
  insert into public.declarations (participation_id, match_chip_snapshot_id, chip_count) values
    (v_p_pedro, v_green, 8), (v_p_pedro, v_red, 10),
    (v_p_tarcisio, v_green, 3), (v_p_tarcisio, v_blue, 3),
    (v_p_chris, v_blue, 8),
    (v_p_vitor, v_green, 4), (v_p_vitor, v_blue, 3);
end $$;
