-- Run after 06 and strictly BEFORE 09_schedule_cleanup.sql: rescues every already-expired board, then adds the lifespan controls. Re-running touches 0 rows as long as nothing has expired since.

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
    now() + make_interval(days => greatest(1, least(90, coalesce(days_param, 60))))
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

create or replace function board_extend(
  board_id_param uuid,
  password_attempt text,
  days_param integer default 28
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  access text;
  new_expiry timestamptz;
begin
  access := board_check_password(board_id_param, password_attempt);
  if access <> 'ok' then
    return jsonb_build_object('status', access);
  end if;

  update boards
  set expires_at = greatest(
    expires_at,
    now() + make_interval(days => greatest(1, least(90, coalesce(days_param, 28))))
  )
  where id = board_id_param
  returning expires_at into new_expiry;

  return jsonb_build_object('status', 'ok', 'expires_at', new_expiry);
end;
$$;

revoke execute on function
  board_create(text, text, text[], integer),
  board_extend(uuid, text, integer)
from public;

grant execute on function
  board_create(text, text, text[], integer),
  board_extend(uuid, text, integer)
to anon, authenticated;

commit;
