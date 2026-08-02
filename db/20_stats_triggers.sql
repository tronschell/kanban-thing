-- Run after 09. Boards are destroyed at 60 days, so these counters are the only permanent record.

begin;

alter table global_stats
  add column if not exists boards_expired bigint not null default 0;

insert into global_stats (boards_created, cards_created, cards_moved)
select 0, 0, 0
where not exists (select 1 from global_stats);

-- Counters already increment from a trigger that predates version control, so adopt it here
-- rather than installing a second one alongside it and double-counting every row.
do $$
declare existing record;
begin
  for existing in
    select tg.tgname, tg.tgrelid::regclass::text as on_table
    from pg_trigger tg
    join pg_proc p on p.oid = tg.tgfoid
    where not tg.tgisinternal
      and p.prosrc ilike '%global_stats%'
      and tg.tgrelid in ('boards'::regclass, 'cards'::regclass, 'card_history'::regclass)
  loop
    raise notice 'dropping pre-existing stats trigger % on %', existing.tgname, existing.on_table;
    execute format('drop trigger if exists %I on %s', existing.tgname, existing.on_table);
  end loop;
end $$;

create or replace function bump_global_stat(column_name text, amount bigint)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if amount <= 0 then
    return;
  end if;

  -- Supabase runs the API role with sql_safe_updates on, which rejects an unqualified UPDATE.
  execute format(
    'update global_stats set %I = %I + $1, last_updated = now() where id is not null',
    column_name, column_name
  ) using amount;
end;
$$;

create or replace function count_inserted_boards()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform bump_global_stat('boards_created', (select count(*) from inserted));
  return null;
end;
$$;

create or replace function count_inserted_cards()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform bump_global_stat('cards_created', (select count(*) from inserted));
  return null;
end;
$$;

create or replace function count_inserted_moves()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform bump_global_stat('cards_moved', (select count(*) from inserted));
  return null;
end;
$$;

drop trigger if exists boards_created_stat on boards;
create trigger boards_created_stat
  after insert on boards
  referencing new table as inserted
  for each statement execute function count_inserted_boards();

drop trigger if exists cards_created_stat on cards;
create trigger cards_created_stat
  after insert on cards
  referencing new table as inserted
  for each statement execute function count_inserted_cards();

drop trigger if exists cards_moved_stat on card_history;
create trigger cards_moved_stat
  after insert on card_history
  referencing new table as inserted
  for each statement execute function count_inserted_moves();

create or replace function cleanup_expired_boards()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  removed bigint;
begin
  with gone as (
    delete from boards where expires_at < now() returning 1
  )
  select count(*) into removed from gone;

  perform bump_global_stat('boards_expired', removed);
end;
$$;

revoke execute on function
  bump_global_stat(text, bigint),
  cleanup_expired_boards()
from public, anon, authenticated;

commit;
