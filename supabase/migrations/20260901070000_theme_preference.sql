alter table public.profiles
  add column theme text not null default 'emerald'
  check (theme in ('emerald', 'royal', 'blood', 'gold', 'violet', 'dark'));
