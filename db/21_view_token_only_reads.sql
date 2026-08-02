-- Run after 20. Idempotent and safe on a database that has already issued view tokens.
--
-- A board id is the write capability: every write RPC is gated by board_check_password, which
-- returns 'ok' for any caller when the board has no password. board_read_shared therefore must
-- not hand a viewer the board id, and a share link must not carry it either. This adds a
-- token-only read and strips id / board_id out of both read payloads.
--
-- The two-argument form stays so links already in the wild keep resolving; its recipients
-- learned the id from their own URL, so breaking them protects nobody.

begin;

create index if not exists boards_view_token_idx
  on boards (view_token) where view_token is not null;

create or replace function board_read_shared(view_token_param uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  shared_board_id uuid;
begin
  select id into shared_board_id
  from boards
  where view_token is not null
    and view_token = view_token_param;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'read_only', true,
    'board', (
      select to_jsonb(entry) from (
        select name, expires_at from boards where id = shared_board_id
      ) entry
    ),
    'columns', (
      select coalesce(jsonb_agg(to_jsonb(entry) order by entry."position"), '[]'::jsonb)
      from (
        select id, name, "position", created_at
        from columns where board_id = shared_board_id
      ) entry
    ),
    'cards', (
      select coalesce(jsonb_agg(to_jsonb(entry) order by entry."position"), '[]'::jsonb)
      from (
        select cards.id, cards.column_id, cards.title, cards.description, cards.color,
               cards.due_date, cards."position", cards.created_at
        from cards join columns on columns.id = cards.column_id
        where columns.board_id = shared_board_id
      ) entry
    )
  );
end;
$$;

create or replace function board_read_shared(board_id_param uuid, view_token_param uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if not exists (
    select 1 from boards
    where id = board_id_param
      and view_token is not null
      and view_token = view_token_param
  ) then
    return jsonb_build_object('status', 'not_found');
  end if;

  return board_read_shared(view_token_param);
end;
$$;

revoke execute on function board_read_shared(uuid) from public;
grant execute on function board_read_shared(uuid) to anon, authenticated;

commit;
