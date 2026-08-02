-- Run after 06. The grace update is a ONE-TIME rescue for boards that outlived their expiry
-- only because cleanup_expired_boards was broken. Boards have a hard 60-day life and there is no
-- extend path: board_extend is dropped here and must never be reintroduced.
-- The grace update pushes expires_at to now() + 30 days with no regard for created_at, so it can
-- carry an old board past created_at + 60 days. 22_expiry_hard_cap.sql clamps that back and adds
-- the constraint that makes it unrepeatable.

with extended as (
  update boards
  set expires_at = now() + interval '30 days'
  where expires_at < now()
  returning 1
)
select count(*) as boards_extended from extended;

begin;

drop function if exists board_create(text, text, text[]);

create or replace function board_create(
  name_param text,
  password_param text default null,
  extra_columns text[] default '{}',
  days_param integer default 60
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  new_board_id uuid;
begin
  insert into boards (name, password_hash, expires_at)
  values (
    coalesce(nullif(btrim(name_param), ''), 'Untitled Board'),
    case
      when password_param is null or password_param = '' then null
      else crypt(password_param, gen_salt('bf'))
    end,
    now() + make_interval(days => greatest(1, least(60, coalesce(days_param, 60))))
  )
  returning id into new_board_id;

  insert into columns (board_id, name, "position")
  values (new_board_id, 'Backlog', -1);

  insert into columns (board_id, name, "position")
  select new_board_id, entry.name, entry.ordinality - 1
  from unnest(extra_columns) with ordinality as entry(name, ordinality);

  return new_board_id;
end;
$$;

drop function if exists board_extend(uuid, text, integer);

revoke execute on function board_create(text, text, text[], integer) from public;

grant execute on function board_create(text, text, text[], integer) to anon, authenticated;

commit;
