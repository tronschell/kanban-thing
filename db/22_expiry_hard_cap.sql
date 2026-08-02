-- Run last, after every other db/*.sql, on the postgres database only.
-- Supersedes 09_schedule_cleanup.sql, which can never pass its own pre-flight guard: boards
-- cross expires_at continuously, so any gap between 08 and 09 re-arms the guard and the cron job
-- is never created. Clamping, reaping and scheduling happen in one transaction here, so there is
-- no gap to lose.
-- Also undoes 08's unbounded +30 days and replaces the table's '2 mons' default, which is 61 or
-- 62 days in ten months of the year. expires_at may never exceed created_at + 60 days.
--
-- This deletes every board the broken job should already have reaped, including boards several
-- months old. That is the product's stated lifecycle, not a side effect. Run
-- 22_expiry_hard_cap_dry_run.sql first to see which boards die and why.
--
-- The constraint carries one day of slack over the cap. created_at defaults to
-- timezone('utc', now()), a timestamp without time zone re-read in the session time zone, so it
-- lands up to one UTC offset away from now(); with zero slack every insert east of UTC violates
-- the constraint. One day also absorbs the DST shift a day-interval on timestamptz picks up when
-- a row is updated from a session in a different time zone than the one that inserted it.

begin;

-- ADD CONSTRAINT takes ACCESS EXCLUSIVE; fail fast rather than queue behind an idle reader.
set local lock_timeout = '5s';

do $$
declare
  already_overdue bigint;
  clamped_into_past bigint;
begin
  select count(*) filter (where expires_at < now()),
         count(*) filter (where expires_at >= now()
                            and least(expires_at, created_at + interval '60 days') < now())
    into already_overdue, clamped_into_past
  from boards;

  raise notice 'deleting % boards already past expires_at, plus % boards that are alive now but fall into the past once clamped to the 60-day cap', already_overdue, clamped_into_past;
end $$;

update boards
set expires_at = created_at + interval '60 days'
where expires_at > created_at + interval '60 days';

alter table boards alter column expires_at set default now() + interval '60 days';

alter table boards drop constraint if exists boards_expiry_within_hard_cap;

alter table boards add constraint boards_expiry_within_hard_cap
  check (expires_at <= created_at + interval '61 days');

-- The guard in 09 existed so a mass deletion could not happen unattended. It still cannot:
-- the backlog is counted and deleted here, in front of the operator, before the job arms.
select cleanup_expired_boards();

create extension if not exists pg_cron;

select cron.unschedule('cleanup-expired-boards')
where exists (select 1 from cron.job where jobname = 'cleanup-expired-boards');

select cron.schedule('cleanup-expired-boards', '0 0 * * *', $$select cleanup_expired_boards()$$);

commit;
