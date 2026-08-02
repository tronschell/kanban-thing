create table job (
  jobid bigserial primary key,
  schedule text not null,
  command text not null,
  jobname text unique
);

create function schedule(p_name text, p_schedule text, p_command text)
returns bigint
language sql
as $$
  insert into cron.job (jobname, schedule, command)
  values (p_name, p_schedule, p_command)
  on conflict (jobname) do update
  set schedule = excluded.schedule, command = excluded.command
  returning jobid;
$$;

create function unschedule(p_name text)
returns boolean
language sql
as $$
  delete from cron.job where jobname = p_name;
  select true;
$$;
