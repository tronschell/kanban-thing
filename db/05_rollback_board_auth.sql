-- Emergency rollback for 04. Restores the pre-04 table grants and the legacy RPCs; dump verify_and_set_board_password and set_session_board_password with pg_get_functiondef before applying 04, they are not in version control.

begin;

grant select, insert, update, delete on
  public.boards,
  public.columns,
  public.cards,
  public.card_history,
  public.tags,
  public.card_tags
to anon, authenticated;

create or replace function verify_board_password(board_id_param uuid, password_attempt text)
returns boolean
language plpgsql
security definer
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

create or replace function set_board_password(board_id_param uuid, new_password text)
returns boolean
language plpgsql
security definer
as $$
begin
  update boards
  set password_hash = case
    when new_password is null or new_password = '' then null
    else crypt(new_password, gen_salt('bf'))
  end
  where id = board_id_param;

  return found;
end;
$$;

create or replace function delete_board_cascade(board_id_param uuid)
returns void
language sql
as $$
  delete from boards where id = board_id_param;
$$;

grant execute on function
  verify_board_password(uuid, text),
  set_board_password(uuid, text),
  delete_board_cascade(uuid)
to anon, authenticated;

commit;
