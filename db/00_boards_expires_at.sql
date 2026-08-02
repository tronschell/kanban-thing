-- Run first, once, in the Supabase SQL editor.

alter table boards
  add column if not exists expires_at timestamptz not null default now() + interval '2 months';
