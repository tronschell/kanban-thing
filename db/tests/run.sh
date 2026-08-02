#!/usr/bin/env bash
# Reproduces the two expiry bugs and proves db/21_expiry_hard_cap.sql fixes them.
# Run from the repo root: bash db/tests/run.sh
# Spins a throwaway postgres:16 container and destroys it on exit. pg_cron is a stub
# (see pg_cron_stub/): it exercises the scheduling logic, not the real cron daemon.

set -euo pipefail
export MSYS_NO_PATHCONV=1

C=kanban-expiry-test
EXTDIR=/usr/share/postgresql/16/extension

FORWARD="00_boards_expires_at.sql 01_cascade_deletes.sql 02_board_deletion.sql \
04_board_auth.sql 06_board_reads.sql 08_expiry_grace_period.sql 10_view_links.sql \
12_board_duplicate.sql 13_board_brief.sql 20_stats_triggers.sql"

cleanup() { docker rm -f "$C" >/dev/null 2>&1 || true; }
trap cleanup EXIT

banner() { printf '\n=============== %s ===============\n' "$1"; }

sql() { local db="$1"; shift; docker exec -i "$C" psql -U postgres -d "$db" -v ON_ERROR_STOP=1 -X "$@"; }
sqlq() { local db="$1"; shift; docker exec -i "$C" psql -U postgres -d "$db" -v ON_ERROR_STOP=1 -X -q "$@"; }
runfile() { sqlq "$1" -f "/db/$2"; }

build() {
  local db="$1"; shift
  docker exec -i "$C" psql -U postgres -d postgres -q -c "create database $db"
  runfile "$db" tests/base_schema.sql
  # Production has pg_cron enabled and the job already scheduled before 02 unschedules it.
  sqlq "$db" <<'SQL'
create extension pg_cron;
select cron.schedule('cleanup-expired-boards', '0 0 * * *', $$select cleanup_expired_boards()$$);
SQL
  for f in "$@"; do runfile "$db" "$f"; done
}

cleanup
docker run -d --name "$C" -e POSTGRES_PASSWORD=test postgres:16 >/dev/null
until docker exec "$C" pg_isready -U postgres >/dev/null 2>&1; do :; done

docker cp db "$C:/db" >/dev/null
docker exec "$C" cp /db/tests/pg_cron_stub/pg_cron.control "$EXTDIR/"
docker exec "$C" cp /db/tests/pg_cron_stub/pg_cron--1.6.sql "$EXTDIR/"


banner "BUG A REPRO: 09 cannot run on a live database"
build buga $FORWARD
sql buga <<'SQL'
insert into boards (name, expires_at) values ('board that just expired', now() - interval '1 second');
select jobname from cron.job;
SQL
echo "--- running db/09_schedule_cleanup.sql ---"
set +e
docker exec -i "$C" psql -U postgres -d buga -v ON_ERROR_STOP=1 -X -f /db/09_schedule_cleanup.sql
echo "psql exit: $?"
set -e
sql buga <<'SQL'
select count(*) as cron_jobs_scheduled from cron.job;
SQL


banner "BUG B REPRO: 08 pushes a board past its hard cap"
build bugb 00_boards_expires_at.sql 01_cascade_deletes.sql 02_board_deletion.sql \
  04_board_auth.sql 06_board_reads.sql
sql bugb <<'SQL'
insert into boards (name, created_at, expires_at)
values ('200 days old, 14 day lifespan', now() - interval '200 days',
        now() - interval '200 days' + interval '14 days');
select name, created_at::date, expires_at::date,
       (expires_at > created_at + interval '60 days') as past_hard_cap
from boards;
SQL
echo "--- running db/08_expiry_grace_period.sql ---"
runfile bugb 08_expiry_grace_period.sql
sql bugb <<'SQL'
select name, created_at::date, expires_at::date,
       (expires_at > created_at + interval '60 days') as past_hard_cap,
       round(extract(epoch from expires_at - created_at) / 86400) as total_lifetime_days
from boards;
SQL


banner "FIX: db/21 applied to a database in exactly production's stuck state"
build fixed $FORWARD
sql fixed <<'SQL'
insert into boards (name, created_at, expires_at) values
  ('over-extended by 08', now() - interval '200 days', now() + interval '30 days'),
  ('plainly expired',     now() - interval '70 days',  now() - interval '10 days'),
  ('expired, cap headroom', now() - interval '20 days', now() - interval '6 days'),
  ('healthy',             now() - interval '1 day',    now() + interval '59 days');
select count(*) as boards, count(*) filter (where expires_at > created_at + interval '60 days') as past_cap,
       count(*) filter (where expires_at < now()) as overdue from boards;
select count(*) as cron_jobs_scheduled from cron.job;
SQL
echo "--- db/09 on this state (still unwinnable) ---"
set +e
docker exec -i "$C" psql -U postgres -d fixed -v ON_ERROR_STOP=1 -X -f /db/09_schedule_cleanup.sql
set -e
echo "--- db/21_expiry_hard_cap.sql ---"
runfile fixed 21_expiry_hard_cap.sql
sql fixed <<'SQL'
select name, round(extract(epoch from expires_at - created_at) / 86400) as lifetime_days from boards;
select count(*) as boards_past_cap from boards where expires_at > created_at + interval '60 days';
select count(*) as boards_overdue from boards where expires_at < now();
select jobname, schedule, command from cron.job;
do $$ begin
  if (select count(*) from cron.job where jobname = 'cleanup-expired-boards') <> 1
     or exists (select 1 from boards where expires_at > created_at + interval '60 days')
     or exists (select 1 from boards where expires_at < now())
  then raise exception 'FIX FAILED'; end if;
  raise notice 'OK: job scheduled, no board past cap, no board overdue';
end $$;
SQL

echo "--- CAP PROOF: the constraint refuses an extend, and allows a move inside the cap ---"
set +e
sql fixed <<'SQL'
update boards set expires_at = created_at + interval '90 days' where name = 'healthy';
SQL
set -e
sql fixed <<'SQL'
update boards set expires_at = created_at + interval '60 days' where name = 'healthy';
SQL
sql fixed <<'SQL'
select board_create('capped at 60', null, '{}', 90) is not null as created_with_90_days_requested;
select name, round(extract(epoch from expires_at - created_at) / 86400) as lifetime_days
from boards where name = 'capped at 60';
SQL


banner "RACE PROOF: a board crosses expires_at mid-migration"
sqlq fixed <<'SQL'
create function race_pause() returns trigger language plpgsql as
$$ begin perform pg_sleep(6); return null; end $$;
create trigger race_pause_trg after delete on boards
  for each statement execute function race_pause();
insert into boards (name, expires_at) values ('reaped by 21', now() - interval '1 minute');
insert into boards (name, expires_at) values ('expires mid-migration', now() + interval '3 seconds');
SQL
echo "--- db/21 runs; 'expires mid-migration' crosses expires_at while the reap step is stalled ---"
runfile fixed 21_expiry_hard_cap.sql
sqlq fixed <<'SQL'
drop trigger race_pause_trg on boards;
drop function race_pause();
SQL
sql fixed <<'SQL'
select name, (expires_at < now()) as overdue_now from boards where name = 'expires mid-migration';
select count(*) as cron_jobs_scheduled from cron.job;
do $$ begin
  if (select count(*) from cron.job where jobname = 'cleanup-expired-boards') <> 1
  then raise exception 'RACE PROOF FAILED: job not scheduled'; end if;
  if not exists (select 1 from boards where name = 'expires mid-migration' and expires_at < now())
  then raise exception 'RACE PROOF INVALID: board did not expire during the migration'; end if;
  raise notice 'OK: 21 committed with a board expiring mid-transaction; job is scheduled';
end $$;
SQL
echo "--- same state, db/09 for contrast ---"
set +e
docker exec -i "$C" psql -U postgres -d fixed -v ON_ERROR_STOP=1 -X -f /db/09_schedule_cleanup.sql
set -e
echo "--- the newly expired board is the scheduled job's problem now, not the migration's ---"
sql fixed <<'SQL'
select cleanup_expired_boards();
select count(*) as boards_overdue from boards where expires_at < now();
SQL


banner "IDEMPOTENT AND STATE-AGNOSTIC"
echo "--- 21 again with the job already scheduled ---"
runfile fixed 21_expiry_hard_cap.sql
echo "--- 21 again with pg_cron and the job absent ---"
sqlq fixed -c "drop extension pg_cron cascade"
runfile fixed 21_expiry_hard_cap.sql
sql fixed <<'SQL'
select jobname from cron.job;
do $$ begin
  if (select count(*) from cron.job where jobname = 'cleanup-expired-boards') <> 1
  then raise exception 'IDEMPOTENCY FAILED'; end if;
  raise notice 'OK: same end state from either starting state';
end $$;
SQL


banner "DELETION PROOF: cleanup_expired_boards deletes and cascades"
build reap $FORWARD 09_schedule_cleanup.sql 21_expiry_hard_cap.sql
sqlq reap <<'SQL'
insert into boards (id, name, expires_at) values
  ('10000000-0000-0000-0000-000000000001', 'doomed', now() - interval '1 day'),
  ('10000000-0000-0000-0000-000000000002', 'keeper', now() + interval '1 day');
insert into columns (id, board_id, name) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Backlog'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Backlog');
insert into cards (id, column_id, title) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'doomed card'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'keeper card');
insert into card_history (card_id, from_column, to_column) values
  ('30000000-0000-0000-0000-000000000001', 'Backlog', 'Done'),
  ('30000000-0000-0000-0000-000000000002', 'Backlog', 'Done');
insert into tags (id, board_id, name) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'urgent'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'urgent');
insert into card_tags (card_id, tag_id) values
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002');
SQL
sql reap <<'SQL'
select (select count(*) from boards) as boards, (select count(*) from columns) as columns,
       (select count(*) from cards) as cards, (select count(*) from card_history) as history,
       (select count(*) from tags) as tags, (select count(*) from card_tags) as card_tags,
       (select boards_expired from global_stats) as boards_expired;
select cleanup_expired_boards();
select (select count(*) from boards) as boards, (select count(*) from columns) as columns,
       (select count(*) from cards) as cards, (select count(*) from card_history) as history,
       (select count(*) from tags) as tags, (select count(*) from card_tags) as card_tags,
       (select boards_expired from global_stats) as boards_expired;
do $$ begin
  if (select count(*) from boards) <> 1 or not exists (select 1 from boards where name = 'keeper')
  then raise exception 'DELETION FAILED: wrong boards survived'; end if;
  if (select count(*) from columns) <> 1 or (select count(*) from cards) <> 1
     or (select count(*) from card_history) <> 1 or (select count(*) from tags) <> 1
     or (select count(*) from card_tags) <> 1
  then raise exception 'CASCADE FAILED'; end if;
  if (select boards_expired from global_stats) <> 1
  then raise exception 'boards_expired not counted'; end if;
  raise notice 'OK: expired board and all its rows gone, keeper untouched, boards_expired = 1';
end $$;
SQL

banner "ALL CHECKS PASSED"
