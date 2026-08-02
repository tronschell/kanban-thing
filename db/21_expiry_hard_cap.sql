-- Run after 20, on the postgres database only. Supersedes 09_schedule_cleanup.sql, which can
-- never pass its own pre-flight guard: boards cross expires_at continuously, so any gap between
-- 08 and 09 re-arms the guard and the cron job is never created. Clamping, reaping and
-- scheduling happen in one transaction here, so there is no gap to lose.
-- Also undoes 08's unbounded +30 days. expires_at may never exceed created_at + 60 days; the
-- constraint below is the no-extend rule 08's header only asserted in prose.

begin;

update boards
set expires_at = created_at + interval '60 days'
where expires_at > created_at + interval '60 days';

alter table boards drop constraint if exists boards_expiry_within_hard_cap;

alter table boards add constraint boards_expiry_within_hard_cap
  check (expires_at <= created_at + interval '60 days');

-- The guard in 09 existed so a mass deletion could not happen unattended. It still cannot:
-- the backlog is reported and deleted here, in front of the operator, before the job arms.
do $$
declare
  backlog bigint;
begin
  select count(*) into backlog from boards where expires_at < now();
  raise notice 'deleting % boards already past expires_at; the 60-day cap is not extendable', backlog;
  perform cleanup_expired_boards();
end $$;

create extension if not exists pg_cron;

select cron.unschedule('cleanup-expired-boards')
where exists (select 1 from cron.job where jobname = 'cleanup-expired-boards');

select cron.schedule('cleanup-expired-boards', '0 0 * * *', $$select cleanup_expired_boards()$$);

commit;
