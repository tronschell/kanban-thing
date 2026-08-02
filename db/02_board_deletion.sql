-- Run after 01. Both delete paths reduce to one statement now that the foreign keys cascade.

-- Repairing cleanup_expired_boards would arm an already-scheduled cron job against every
-- currently-expired board, so the job is unscheduled here. It is re-created only by
-- 22_expiry_hard_cap.sql, which reports and reaps the backlog in front of the operator first.
-- 09_schedule_cleanup.sql was the original re-creation step and is superseded; do not run it.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from cron.job where jobname = 'cleanup-expired-boards') then
    perform cron.unschedule('cleanup-expired-boards');
  end if;
end $$;

create or replace function delete_board_cascade(board_id_param uuid)
returns void
language sql
as $$
  delete from boards where id = board_id_param;
$$;

create or replace function cleanup_expired_boards()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from boards where expires_at < now();
$$;

revoke execute on function cleanup_expired_boards() from public, anon, authenticated;
