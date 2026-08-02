-- Run after 04. Block A (read functions + grants) is additive and safe with the current client; run block B only once the read-side client is deployed.

begin;

create or replace function board_read(
  board_id_param uuid,
  password_attempt text,
  include_history boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  access text;
begin
  access := board_check_password(board_id_param, password_attempt);
  if access <> 'ok' then
    return jsonb_build_object('status', access);
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'board', (
      select to_jsonb(board)
      from (
        select id, created_at, name, expires_at, password_hash is not null as requires_password
        from boards
        where id = board_id_param
      ) board
    ),
    'columns', (
      select coalesce(jsonb_agg(to_jsonb(entry) order by entry."position"), '[]'::jsonb)
      from (
        select id, board_id, name, "position", created_at
        from columns
        where board_id = board_id_param
      ) entry
    ),
    'cards', (
      select coalesce(jsonb_agg(to_jsonb(entry) order by entry."position"), '[]'::jsonb)
      from (
        select cards.id, cards.column_id, cards.title, cards.description, cards.color,
               cards.due_date, cards."position", cards.created_at
        from cards
        join columns on columns.id = cards.column_id
        where columns.board_id = board_id_param
      ) entry
    ),
    'card_history', case when include_history then (
      select coalesce(jsonb_agg(to_jsonb(entry) order by entry."timestamp"), '[]'::jsonb)
      from (
        select card_history.id, card_history.card_id, card_history.from_column,
               card_history.to_column, card_history."timestamp"
        from card_history
        join cards on cards.id = card_history.card_id
        join columns on columns.id = cards.column_id
        where columns.board_id = board_id_param
      ) entry
    ) else '[]'::jsonb end
  );
end;
$$;

create or replace function board_summary(board_id_param uuid, password_attempt text default '')
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  access text;
begin
  access := board_check_password(board_id_param, password_attempt);
  if access <> 'ok' then
    return jsonb_build_object('status', access);
  end if;

  return (
    select jsonb_build_object(
      'status', 'ok',
      'requires_password', password_hash is not null,
      'name', name,
      'expires_at', expires_at
    )
    from boards
    where id = board_id_param
  );
end;
$$;

revoke execute on function
  board_read(uuid, text, boolean),
  board_summary(uuid, text)
from public;

grant execute on function
  board_read(uuid, text, boolean),
  board_summary(uuid, text)
to anon, authenticated;

commit;

-- ===== BLOCK B: LOCKDOWN. Everything below breaks any client that still reads tables directly. =====

begin;

revoke select (id, created_at, name, expires_at) on public.boards from anon, authenticated;

revoke select on
  public.boards,
  public.columns,
  public.cards,
  public.card_history,
  public.tags,
  public.card_tags
from anon, authenticated;

grant select on public.global_stats to anon, authenticated;

commit;
