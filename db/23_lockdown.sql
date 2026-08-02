-- Run after 22, and ONLY once the RPC-only client is deployed. This is the Block B lockdown from
-- 04 and 06 consolidated into one idempotent file, plus the policy drops those blocks were missing.
--
-- Re-running 04 fails: its dead-function sweep cannot drop verify_board_password while the legacy
-- "Enable delete access with password" policies still reference it. Those policies are the reason
-- this file exists at all -- "Enable read access for all users" is USING (true), so every board and
-- every password_hash is readable by anyone holding the public anon key.
--
-- After this runs, RLS stays enabled on the four app tables with no policies at all, which denies
-- direct access outright, and the table grants are revoked as well. Every read and write must go
-- through the SECURITY DEFINER RPCs. global_stats stays readable for /api/stats.

begin;

set local lock_timeout = '5s';

do $$
declare
  target record;
begin
  for target in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('boards', 'columns', 'cards', 'card_history')
  loop
    execute format(
      'drop policy %I on %I.%I',
      target.policyname, target.schemaname, target.tablename
    );
  end loop;
end;
$$;

do $$
declare
  dead record;
begin
  for dead in
    select oid::regprocedure as signature
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname in (
        'set_board_password',
        'verify_board_password',
        'verify_and_set_board_password',
        'set_session_board_password',
        'get_session_board_password',
        'set_board_password_context',
        'hash_board_password',
        'delete_board_cascade'
      )
  loop
    execute format('drop function %s', dead.signature);
  end loop;
end;
$$;

revoke select (id, created_at, name, expires_at) on public.boards from anon, authenticated;

revoke all on
  public.boards,
  public.columns,
  public.cards,
  public.card_history,
  public.tags,
  public.card_tags
from anon, authenticated;

-- 06 block B only granted select here, so the insert/update/delete/truncate from the original
-- grant all survived and left the stats counters forgeable.
revoke all on public.global_stats from anon, authenticated;

grant select on public.global_stats to anon, authenticated;

commit;
