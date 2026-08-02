-- Run after 08. Additive: one column, two new functions. No existing function is modified.

begin;

alter table boards add column if not exists brief text;

create or replace function board_brief(board_id_param uuid, password_attempt text)
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
    select jsonb_build_object('status', 'ok', 'brief', brief)
    from boards where id = board_id_param
  );
end;
$$;

create or replace function board_set_brief(
  board_id_param uuid,
  password_attempt text,
  brief_param text
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

  update boards
  set brief = nullif(btrim(left(coalesce(brief_param, ''), 4000), E' \t\r\n'), '')
  where id = board_id_param;

  return 'ok';
end;
$$;

revoke execute on function board_brief(uuid, text), board_set_brief(uuid, text, text) from public;
grant execute on function board_brief(uuid, text), board_set_brief(uuid, text, text)
  to anon, authenticated;

commit;
