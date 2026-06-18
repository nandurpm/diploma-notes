-- Persistent rate limiting for the authenticated quiz Edge Function.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.quiz_rate_limits (
  user_id uuid not null,
  action text not null,
  window_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (user_id, action)
);

revoke all on private.quiz_rate_limits from public, anon, authenticated;

create or replace function public.consume_quiz_rate_limit(
  p_user_id uuid,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if p_user_id is null
    or coalesce(length(p_action), 0) = 0
    or p_limit < 1
    or p_window_seconds < 1
  then
    return false;
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds)
      * p_window_seconds
  );

  insert into private.quiz_rate_limits (
    user_id, action, window_start, request_count
  ) values (
    p_user_id, left(p_action, 64), v_window_start, 1
  )
  on conflict (user_id, action) do update
  set
    window_start = excluded.window_start,
    request_count = case
      when private.quiz_rate_limits.window_start = excluded.window_start
        then private.quiz_rate_limits.request_count + 1
      else 1
    end
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_quiz_rate_limit(uuid, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_quiz_rate_limit(uuid, text, integer, integer)
  to service_role;

-- The audit table is private by default; authenticated administrators can read it.
alter table public.admin_audit_log enable row level security;
revoke all on public.admin_audit_log from anon;
revoke insert, update, delete on public.admin_audit_log from authenticated;
grant select on public.admin_audit_log to authenticated;

drop policy if exists "admin_audit_select_admins" on public.admin_audit_log;
create policy "admin_audit_select_admins"
on public.admin_audit_log
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);
