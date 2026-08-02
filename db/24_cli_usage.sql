-- Run after 23. Idempotent: re-running adds nothing and loses no counts.
-- Aggregate CLI telemetry with no identifiers in it: a daily count per version and nothing else.
-- anon reaches the table only through the two functions below, so there is no row to correlate
-- and no column that could grow one later.

begin;

create table if not exists cli_usage (
  day date not null,
  version text not null,
  checks bigint not null default 0,
  primary key (day, version)
);

alter table cli_usage enable row level security;

revoke all on table cli_usage from public, anon, authenticated;

create or replace function bump_cli_check(version_param text)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  insert into cli_usage (day, version, checks)
  values (
    current_date,
    coalesce(nullif(left(btrim(version_param), 32), ''), 'unknown'),
    1
  )
  on conflict (day, version) do update set checks = cli_usage.checks + 1;
end;
$$;

create or replace function cli_usage_totals()
returns jsonb
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select jsonb_build_object(
    'total_checks', coalesce((select sum(checks) from cli_usage), 0),
    'checks_30d', coalesce(
      (select sum(checks) from cli_usage where day >= current_date - 30), 0
    ),
    'versions', coalesce((
      select jsonb_agg(
        jsonb_build_object('version', version, 'checks', checks) order by checks desc
      )
      from (select version, sum(checks) as checks from cli_usage group by version) totals
    ), '[]'::jsonb)
  );
$$;

revoke execute on function bump_cli_check(text), cli_usage_totals() from public;
grant execute on function bump_cli_check(text), cli_usage_totals() to anon, authenticated;

commit;
