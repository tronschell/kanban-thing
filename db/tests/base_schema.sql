-- Test fixture only. The base tables were created through the Supabase UI and are not in
-- version control, so run-expiry.sh recreates them here before applying db/00 onwards.
-- created_at's default is copied verbatim from the production schema dump. It is deliberately
-- not plain now(): timezone('utc', now()) yields a timestamp WITHOUT time zone that the column
-- re-reads in the session time zone, which is the clock skew the tests exercise.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
grant usage on schema public, extensions to anon, authenticated;

create table boards (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  name text not null default 'Untitled Board',
  password_hash text
);

create table columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id),
  name text not null,
  "position" integer not null default 0,
  created_at timestamptz not null default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid references columns(id),
  title text not null default '',
  description text,
  color text,
  due_date timestamptz,
  "position" integer not null default 0,
  created_at timestamptz not null default now()
);

create table card_history (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id),
  from_column text,
  to_column text,
  "timestamp" timestamptz not null default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id),
  name text not null,
  color text
);

create table card_tags (
  card_id uuid references cards(id),
  tag_id uuid references tags(id),
  primary key (card_id, tag_id)
);

create table global_stats (
  id integer primary key default 1,
  boards_created bigint not null default 0,
  cards_created bigint not null default 0,
  cards_moved bigint not null default 0,
  last_updated timestamptz not null default now()
);

grant select, insert, update, delete on
  boards, columns, cards, card_history, tags, card_tags
to anon, authenticated;
