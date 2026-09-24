-- Prevent authenticated users from promoting their own profile role.
-- The designated blog owner may still manage roles when needed.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.is_blog_owner() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'student';
    return new;
  end if;

  if new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

revoke all on function public.protect_profile_role() from public;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
before insert or update of role on public.profiles
for each row execute function public.protect_profile_role();
