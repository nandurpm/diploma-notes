-- SECURITY INVOKER is essential: current_user must identify the caller, not
-- the function owner. is_blog_owner remains an authenticated, definer lookup.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security invoker
set search_path = public, auth
as $$
begin
  if current_user in ('postgres', 'service_role') then
    return new;
  end if;
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if public.is_blog_owner() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.role := 'student';
  elsif new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;
revoke all on function public.protect_profile_role() from public, anon, authenticated;
