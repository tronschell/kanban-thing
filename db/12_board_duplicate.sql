-- Run after 08. Additive: one new function, nothing existing changes.

begin;

create or replace function board_duplicate(
  board_id_param uuid,
  password_attempt text,
  new_name text,
  include_cards boolean default true,
  days_param integer default 60
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  access text;
  new_board_id uuid;
begin
  access := board_check_password(board_id_param, password_attempt);
  if access <> 'ok' then
    return jsonb_build_object('status', access);
  end if;

  insert into boards (name, password_hash, expires_at)
  select coalesce(nullif(btrim(new_name), ''), source.name || ' (copy)'),
         source.password_hash,
         now() + make_interval(days => greatest(1, least(60, coalesce(days_param, 60))))
  from boards source
  where source.id = board_id_param
  returning id into new_board_id;

  -- gen_random_uuid() is volatile and `mapping` is referenced twice, so Postgres
  -- materialises it: every card joins the same new column id its column got.
  with mapping as (
    select id as old_id, gen_random_uuid() as new_id, name, "position"
    from columns
    where board_id = board_id_param
  ), created_columns as (
    insert into columns (id, board_id, name, "position")
    select new_id, new_board_id, name, "position" from mapping
    returning id
  )
  insert into cards (column_id, title, description, color, due_date, "position")
  select mapping.new_id, cards.title, cards.description, cards.color,
         cards.due_date, cards."position"
  from cards
  join mapping on mapping.old_id = cards.column_id
  where coalesce(include_cards, true);

  return jsonb_build_object('status', 'ok', 'board_id', new_board_id);
end;
$$;

revoke execute on function board_duplicate(uuid, text, text, boolean, integer) from public;
grant execute on function board_duplicate(uuid, text, text, boolean, integer)
  to anon, authenticated;

commit;
