-- Run against db/00..21. Proves that a token-only share link confers read access and nothing
-- else: the board id never reaches the viewer, the token is useless as a board id, legacy
-- two-argument links still resolve, and the owner can still write.

\set ON_ERROR_STOP on

set role anon;

select board_create('Victim board', null, array['Doing'], 60) as board_id \gset
select (board_view_token(:'board_id', ''))->>'view_token' as view_token \gset
select board_read_shared(:'view_token') as shared \gset

create temp table target as select :'board_id'::uuid as board_id, :'view_token'::uuid as view_token;

\echo ''
\echo '--- share link handed to the viewer (post-fix): no board id ---'
select '/board?view=' || :'view_token' as share_url;

\echo '--- legitimate read over the token alone still returns the whole board ---'
select
  :'shared'::jsonb->>'status' as status,
  :'shared'::jsonb->'board'->>'name' as board_name,
  jsonb_array_length(:'shared'::jsonb->'columns') as columns,
  jsonb_array_length(:'shared'::jsonb->'cards') as cards;

\echo '--- and it no longer carries the board id anywhere ---'
select
  :'shared'::jsonb->'board' as board_payload,
  :'shared'::jsonb->'columns'->0 as first_column_payload;

\echo '--- EXPLOIT, retried: the token is all the viewer has, and it is not a board id ---'
select board_rename(:'view_token', '', 'Owned by the viewer') as rename_result;
select board_save_cards(:'view_token', '', '[]'::jsonb) as save_cards_result;
select board_set_password(:'view_token', '', 'attacker-only') as set_password_result;
select board_delete(:'view_token', '') as delete_result;

\echo '--- and the viewer cannot query the id out of the tables either ---'
do $$
declare
  leaked uuid;
begin
  begin
    execute 'select id from boards limit 1' into leaked;
    raise exception 'anon could read boards.id directly';
  exception when insufficient_privilege then
    raise notice 'select id from boards -> permission denied, as expected';
  end;

  begin
    execute 'select board_id from columns limit 1' into leaked;
    raise exception 'anon could read columns.board_id directly';
  exception when insufficient_privilege then
    raise notice 'select board_id from columns -> permission denied, as expected';
  end;
end $$;

\echo '--- backward compatibility: an already-issued /board?id=B&view=T link still resolves ---'
select
  board_read_shared(:'board_id', :'view_token')->>'status' as legacy_status,
  board_read_shared(:'board_id', :'view_token')->'board'->>'name' as legacy_board_name;

\echo '--- and a wrong board id with a valid token is still rejected ---'
select board_read_shared(gen_random_uuid(), :'view_token')->>'status' as mismatched_status;

\echo '--- the owner, who holds the id, can still write ---'
select board_rename(:'board_id', '', 'Renamed by the owner') as owner_rename_result;

\echo '--- assertions ---'
do $$
declare
  victim uuid;
  token uuid;
  shared jsonb;
begin
  select board_id, view_token into victim, token from target;
  shared := board_read_shared(token);

  if shared->>'status' <> 'ok' then
    raise exception 'token-only read should still work';
  end if;
  if shared->'board' ? 'id' then
    raise exception 'board payload still leaks the board id';
  end if;
  if exists (
    select 1 from jsonb_array_elements(shared->'columns') entry where entry ? 'board_id'
  ) then
    raise exception 'column payload still leaks board_id';
  end if;
  if board_read_shared(victim, token)->>'status' <> 'ok' then
    raise exception 'legacy two-argument link stopped working';
  end if;
  if board_read_shared(victim, token)->'board' ? 'id' then
    raise exception 'legacy payload still leaks the board id';
  end if;

  if board_rename(token, '', 'Owned by the viewer') <> 'not_found' then
    raise exception 'a view token was accepted as a board id';
  end if;
  if board_set_password(token, '', 'attacker-only') <> 'not_found' then
    raise exception 'a view token was accepted by board_set_password';
  end if;
  if board_read(victim, '', false)->'board'->>'name' <> 'Renamed by the owner' then
    raise exception 'the owner lost write access';
  end if;

  raise notice 'BYPASS CLOSED: the token reads the board, cannot write it, and never reveals the board id';
end $$;

reset role;
