-- Run last, on the postgres database only. Aborts unless 08_expiry_grace_period.sql has already rescued every board that is past expires_at.

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
