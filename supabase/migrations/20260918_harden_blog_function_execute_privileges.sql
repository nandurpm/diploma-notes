-- Harden Blog & GK SECURITY DEFINER functions.
-- Functions are executable by PUBLIC / client roles by default in PostgreSQL,
-- so explicitly expose only the RPCs the authenticated UI needs.

-- Owner/admin and contributor RPCs: signed-in callers only.
revoke execute on function public.approve_blog_post(uuid, text, boolean) from public, anon;
revoke execute on function public.blog_review_queue() from public, anon;
revoke execute on function public.is_blog_owner() from public, anon;
revoke execute on function public.reject_blog_post(uuid, text) from public, anon;
revoke execute on function public.request_blog_changes(uuid, text) from public, anon;
revoke execute on function public.submit_blog_post(uuid) from public, anon;

grant execute on function public.approve_blog_post(uuid, text, boolean) to authenticated;
grant execute on function public.blog_review_queue() to authenticated;
grant execute on function public.is_blog_owner() to authenticated;
grant execute on function public.reject_blog_post(uuid, text) to authenticated;
grant execute on function public.request_blog_changes(uuid, text) to authenticated;
grant execute on function public.submit_blog_post(uuid) to authenticated;

-- Trigger-only functions should not be directly callable by API client roles.
revoke execute on function public.enforce_blog_post_workflow() from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;

-- Prevent future postgres-owned functions in the exposed public schema from
-- automatically becoming anonymously executable. Public RPCs must be granted
-- deliberately when created.
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon;
