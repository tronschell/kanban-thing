-- Run after 08. Additive: nothing existing changes behaviour.

alter table boards add column if not exists view_token uuid;

create or replace function board_view_token(board_id_param uuid, password_attempt text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  access text;
  token uuid;
begin
  access := board_check_password(board_id_param, password_attempt);
  if access <> 'ok' then
    return jsonb_build_object('status', access);
  end if;

  select view_token into token from boards where id = board_id_param;
  if token is null then
    token := gen_random_uuid();
    update boards set view_token = token where id = board_id_param;
  end if;

  return jsonb_build_object('status', 'ok', 'view_token', token);
end;
$$;

create or replace function board_revoke_view_token(board_id_param uuid, password_attempt text)
returns text
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  access text;
begin
  access := board_check_password(board_id_param, password_attempt);
  if access <> 'ok' then
    return access;
  end if;

  update boards set view_token = null where id = board_id_param;
  return 'ok';
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

  return jsonb_build_object(
    'status', 'ok',
    'read_only', true,
    'board', (
      select to_jsonb(entry) from (
        select id, name, expires_at from boards where id = board_id_param
      ) entry
    ),
    'columns', (
      select coalesce(jsonb_agg(to_jsonb(entry) order by entry."position"), '[]'::jsonb)
      from (
        select id, board_id, name, "position", created_at
        from columns where board_id = board_id_param
      ) entry
    ),
    'cards', (
      select coalesce(jsonb_agg(to_jsonb(entry) order by entry."position"), '[]'::jsonb)
      from (
        select cards.id, cards.column_id, cards.title, cards.description, cards.color,
               cards.due_date, cards."position", cards.created_at
        from cards join columns on columns.id = cards.column_id
        where columns.board_id = board_id_param
      ) entry
    )
  );
end;
$$;

revoke execute on function
  board_view_token(uuid, text),
  board_revoke_view_token(uuid, text),
  board_read_shared(uuid, uuid)
from public;

grant execute on function
  board_view_token(uuid, text),
  board_revoke_view_token(uuid, text),
  board_read_shared(uuid, uuid)
to anon, authenticated;
