-- SUPERSEDED by 22_expiry_hard_cap.sql. Do not run. Kept for the history of what was applied.
-- The guard below can never pass on a live database: boards cross expires_at continuously, so
-- whatever 08 rescued is overdue again by the time this file runs, and the cron job is never
-- created. 22 clamps, reaps and schedules in one transaction instead.

do $$
declare
  overdue bigint;
begin
  select count(*) into overdue from boards where expires_at < now();
  if overdue > 0 then
    raise exception 'Run 08_expiry_grace_period.sql first: % boards are past expires_at and this job would delete them', overdue;
  end if;
end;
$$;

create extension if not exists pg_cron;

select cron.unschedule('cleanup-expired-boards')
where exists (select 1 from cron.job where jobname = 'cleanup-expired-boards');

select cron.schedule('cleanup-expired-boards', '0 0 * * *', $$select cleanup_expired_boards()$$);
