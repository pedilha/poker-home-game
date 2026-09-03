alter table public.profiles
  add column color_scheme text not null default 'dark'
  check (color_scheme in ('light', 'dark'));
