-- Hotfix for db/23_lockdown.sql. It dropped verify_board_password as dead code, but the
-- board_save_cards deployed in production is older than the one in db/04_board_auth.sql and
-- still calls it, so every card write started failing with 42883. The repo's SQL files are
-- not a faithful record of production; do not infer "unused" from them alone.
--
-- Restores the function exactly as db/05_rollback_board_auth.sql defines it. This does not
-- reopen the read hole: that came from table grants and USING (true) policies, which stay
-- revoked. This function only ever returns a boolean.

begin;

set local lock_timeout = '5s';

create or replace function verify_board_password(board_id_param uuid, password_attempt text)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'extensions', 'pg_temp'
as $$
declare
  stored_hash text;
begin
  select password_hash into stored_hash from boards where id = board_id_param;

  if stored_hash is null then
    return true;
  end if;

  return stored_hash = crypt(password_attempt, stored_hash);
end;
$$;

revoke all on function verify_board_password(uuid, text) from public;
grant execute on function verify_board_password(uuid, text) to anon, authenticated;

commit;

-- Which of the other functions db/23 dropped are still referenced by live code?
select
  p.proname as calling_function,
  pg_get_function_identity_arguments(p.oid) as args,
  missing.name as still_calls
from pg_proc p
cross join lateral (
  values
    ('set_board_password'),
    ('verify_and_set_board_password'),
    ('set_session_board_password'),
    ('get_session_board_password'),
    ('set_board_password_context'),
    ('hash_board_password'),
    ('delete_board_cascade')
) as missing(name)
where p.pronamespace = 'public'::regnamespace
  and p.prosrc like '%' || missing.name || '%'
order by p.proname;
