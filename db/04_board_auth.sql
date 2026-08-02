-- Run after 02. Block A (functions + grants) is additive and safe with the current client; run block B only once the new client is deployed.

begin;

create or replace function board_check_password(board_id_param uuid, password_attempt text)
returns text
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  stored_hash text;
begin
  select password_hash into stored_hash from boards where id = board_id_param;

  if not found then
    return 'not_found';
  end if;

  if stored_hash is null then
    return 'ok';
  end if;

  if stored_hash = crypt(coalesce(password_attempt, ''), stored_hash) then
    return 'ok';
  end if;

  return 'wrong_password';
end;
$$;

create or replace function board_requires_password(board_id_param uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select password_hash is not null from boards where id = board_id_param;
$$;

create or replace function board_create(
  name_param text,
  password_param text default null,
  extra_columns text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  new_board_id uuid;
begin
  insert into boards (name, password_hash)
  values (
    coalesce(nullif(btrim(name_param), ''), 'Untitled Board'),
    case
      when password_param is null or password_param = '' then null
      else crypt(password_param, gen_salt('bf'))
    end
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

create or replace function board_set_password(
  board_id_param uuid,
  current_password text,
  new_password text
)
returns text
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  access text;
begin
  access := board_check_password(board_id_param, current_password);
  if access <> 'ok' then
    return access;
  end if;

  update boards
  set password_hash = case
    when new_password is null or new_password = '' then null
    else crypt(new_password, gen_salt('bf'))
  end
  where id = board_id_param;

  return 'ok';
end;
$$;

create or replace function board_rename(board_id_param uuid, password_attempt text, new_name text)
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

  update boards
  set name = coalesce(nullif(btrim(new_name), ''), 'Untitled Board')
  where id = board_id_param;

  return 'ok';
end;
$$;

create or replace function board_delete(board_id_param uuid, password_attempt text)
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

  delete from boards where id = board_id_param;

  return 'ok';
end;
$$;

create or replace function board_save_columns(
  board_id_param uuid,
  password_attempt text,
  columns_param jsonb default '[]'::jsonb,
  delete_ids uuid[] default '{}'
)
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

  delete from columns
  where id = any(delete_ids)
    and board_id = board_id_param;

  insert into columns (id, board_id, name, "position")
  select incoming.id, board_id_param, incoming.name, incoming."position"
  from jsonb_to_recordset(columns_param)
    as incoming(id uuid, name text, "position" integer)
  on conflict (id) do update
  set name = excluded.name,
      "position" = excluded."position"
  where columns.board_id = board_id_param;

  return 'ok';
end;
$$;

create or replace function board_save_cards(
  board_id_param uuid,
  password_attempt text,
  cards_param jsonb default '[]'::jsonb,
  delete_ids uuid[] default '{}'
)
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

  delete from cards
  where id = any(delete_ids)
    and column_id in (select id from columns where board_id = board_id_param);

  insert into card_history (card_id, from_column, to_column)
  select existing.id, moved_from.name, moved_to.name
  from jsonb_to_recordset(cards_param) as incoming(id uuid, column_id uuid)
  join cards existing on existing.id = incoming.id
  join columns moved_from
    on moved_from.id = existing.column_id and moved_from.board_id = board_id_param
  join columns moved_to
    on moved_to.id = incoming.column_id and moved_to.board_id = board_id_param
  where existing.column_id <> incoming.column_id;

  insert into cards (id, column_id, title, description, color, due_date, "position")
  select incoming.id, incoming.column_id, incoming.title, incoming.description,
         incoming.color, incoming.due_date, incoming."position"
  from jsonb_to_recordset(cards_param) as incoming(
    id uuid,
    column_id uuid,
    title text,
    description text,
    color text,
    due_date timestamptz,
    "position" integer
  )
  join columns destination on destination.id = incoming.column_id and destination.board_id = board_id_param
  on conflict (id) do update
  set column_id = excluded.column_id,
      title = excluded.title,
      description = excluded.description,
      color = excluded.color,
      due_date = excluded.due_date,
      "position" = excluded."position"
  where exists (
    select 1 from columns owning_column
    where owning_column.id = cards.column_id and owning_column.board_id = board_id_param
  );

  return 'ok';
end;
$$;

revoke execute on function
  board_check_password(uuid, text),
  board_requires_password(uuid),
  board_create(text, text, text[]),
  board_set_password(uuid, text, text),
  board_rename(uuid, text, text),
  board_delete(uuid, text),
  board_save_columns(uuid, text, jsonb, uuid[]),
  board_save_cards(uuid, text, jsonb, uuid[])
from public;

grant execute on function
  board_check_password(uuid, text),
  board_requires_password(uuid),
  board_create(text, text, text[]),
  board_set_password(uuid, text, text),
  board_rename(uuid, text, text),
  board_delete(uuid, text),
  board_save_columns(uuid, text, jsonb, uuid[]),
  board_save_cards(uuid, text, jsonb, uuid[])
to anon, authenticated;

commit;

-- ===== BLOCK B: LOCKDOWN. Everything below breaks the pre-migration client. =====

begin;

revoke insert, update, delete, truncate on
  public.boards,
  public.columns,
  public.cards,
  public.card_history,
  public.tags,
  public.card_tags
from anon, authenticated;

revoke select on public.boards from anon, authenticated;

grant select (id, created_at, name, expires_at) on public.boards to anon, authenticated;

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
        'delete_board_cascade'
      )
  loop
    execute format('drop function %s', dead.signature);
  end loop;
end;
$$;

commit;
