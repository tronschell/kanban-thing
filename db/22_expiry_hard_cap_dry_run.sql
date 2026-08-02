-- Read-only. Run before 22_expiry_hard_cap.sql, on any database including production, to see
-- which boards that migration deletes. The transaction is read only, so it cannot write even if
-- a trigger or default tried to; nothing here needs to be undone.
-- 'DIES: alive now, clamp pulls it into the past' is a board whose expires_at was pushed beyond
-- created_at + 60 days by 08 or by the table's old '2 mons' default. Clamping it back to the cap
-- puts it in the past, and the reap in 22 takes it in the same transaction.

begin;
set transaction read only;

select name, created_at::date, expires_at::date,
  case when expires_at < now() then 'DIES: already past expires_at'
       when least(expires_at, created_at + interval '60 days') < now() then 'DIES: alive now, clamp pulls it into the past'
       else 'survives' end as fate
from boards order by 4, 1;

commit;
