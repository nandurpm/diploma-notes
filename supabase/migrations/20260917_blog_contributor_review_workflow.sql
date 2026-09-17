-- Community Blog & GK workflow: contributors suggest posts; only the designated
-- POLY PMNA owner email can approve and publish them.

alter table public.blog_posts
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewer_note text;

alter table public.blog_posts drop constraint if exists blog_posts_status_check;
alter table public.blog_posts add constraint blog_posts_status_check
  check (status in ('draft','pending_review','changes_requested','rejected','published'));

alter table public.blog_posts drop constraint if exists blog_posts_reviewer_note_len;
alter table public.blog_posts add constraint blog_posts_reviewer_note_len
  check (reviewer_note is null or char_length(reviewer_note) <= 2000);

create index if not exists blog_posts_review_queue_idx
  on public.blog_posts (status, submitted_at desc)
  where status = 'pending_review';

-- Approval authority is bound to the owner's authenticated email, not a client-side
-- button and not a generated UUID embedded in source control.
create or replace function public.is_blog_owner()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and lower(coalesce(u.email::text, '')) = 'nandakumarkdpm@gmail.com'
  );
$$;

revoke all on function public.is_blog_owner() from public;
grant execute on function public.is_blog_owner() to authenticated;

create or replace function public.enforce_blog_post_workflow()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_owner boolean := public.is_blog_owner();
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if tg_op = 'INSERT' then
    new.updated_at := now();

    if v_owner then
      new.created_by := coalesce(new.created_by, v_uid);
      new.updated_by := v_uid;
      if new.status = 'published' then
        new.published_at := coalesce(new.published_at, now());
        new.reviewed_at := coalesce(new.reviewed_at, now());
        new.reviewed_by := coalesce(new.reviewed_by, v_uid);
      elsif new.status = 'pending_review' then
        new.submitted_at := coalesce(new.submitted_at, now());
        new.published_at := null;
        new.featured := false;
      else
        new.published_at := null;
        new.featured := false;
      end if;
    else
      new.created_by := v_uid;
      new.updated_by := v_uid;
      new.featured := false;
      new.published_at := null;
      new.reviewed_at := null;
      new.reviewed_by := null;
      new.reviewer_note := null;
      if new.status = 'pending_review' then
        new.submitted_at := now();
      else
        new.status := 'draft';
        new.submitted_at := null;
      end if;
    end if;

    return new;
  end if;

  new.updated_at := now();

  if v_owner then
    new.created_by := old.created_by;
    new.updated_by := v_uid;

    if new.status = 'published' then
      if old.status <> 'published' or new.published_at is null then
        new.published_at := coalesce(new.published_at, now());
      end if;
      if old.status <> 'published' then
        new.reviewed_at := now();
        new.reviewed_by := v_uid;
      end if;
    else
      new.published_at := null;
      new.featured := false;
      if new.status = 'pending_review' and old.status <> 'pending_review' then
        new.submitted_at := now();
      end if;
    end if;

    return new;
  end if;

  if old.created_by is distinct from v_uid then
    raise exception 'You can only edit your own suggestions';
  end if;

  if old.status not in ('draft','changes_requested','rejected') then
    raise exception 'This suggestion is locked while it is being reviewed or after publication';
  end if;

  if new.status not in ('draft','pending_review') then
    raise exception 'Contributors can save drafts or submit for review only';
  end if;

  new.created_by := old.created_by;
  new.updated_by := v_uid;
  new.featured := false;
  new.published_at := null;
  new.reviewed_at := old.reviewed_at;
  new.reviewed_by := old.reviewed_by;
  new.reviewer_note := old.reviewer_note;

  if new.status = 'pending_review' then
    new.submitted_at := now();
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_blog_post_workflow() from public;

drop trigger if exists blog_posts_workflow_guard on public.blog_posts;
create trigger blog_posts_workflow_guard
before insert or update on public.blog_posts
for each row execute function public.enforce_blog_post_workflow();

drop policy if exists blog_posts_admin_select on public.blog_posts;
drop policy if exists blog_posts_admin_insert on public.blog_posts;
drop policy if exists blog_posts_admin_update on public.blog_posts;
drop policy if exists blog_posts_admin_delete on public.blog_posts;
drop policy if exists blog_posts_owner_select on public.blog_posts;
drop policy if exists blog_posts_owner_insert on public.blog_posts;
drop policy if exists blog_posts_owner_update on public.blog_posts;
drop policy if exists blog_posts_owner_delete on public.blog_posts;
drop policy if exists blog_posts_contributor_select on public.blog_posts;
drop policy if exists blog_posts_contributor_insert on public.blog_posts;
drop policy if exists blog_posts_contributor_update on public.blog_posts;
drop policy if exists blog_posts_contributor_delete on public.blog_posts;

create policy blog_posts_owner_select on public.blog_posts
for select to authenticated using (public.is_blog_owner());
create policy blog_posts_owner_insert on public.blog_posts
for insert to authenticated with check (public.is_blog_owner());
create policy blog_posts_owner_update on public.blog_posts
for update to authenticated using (public.is_blog_owner()) with check (public.is_blog_owner());
create policy blog_posts_owner_delete on public.blog_posts
for delete to authenticated using (public.is_blog_owner());

create policy blog_posts_contributor_select on public.blog_posts
for select to authenticated using (created_by = (select auth.uid()));
create policy blog_posts_contributor_insert on public.blog_posts
for insert to authenticated with check (
  created_by = (select auth.uid()) and status in ('draft','pending_review')
  and featured = false and published_at is null
);
create policy blog_posts_contributor_update on public.blog_posts
for update to authenticated
using (created_by = (select auth.uid()) and status in ('draft','changes_requested','rejected'))
with check (
  created_by = (select auth.uid()) and status in ('draft','pending_review')
  and featured = false and published_at is null
);
create policy blog_posts_contributor_delete on public.blog_posts
for delete to authenticated
using (created_by = (select auth.uid()) and status in ('draft','changes_requested','rejected'));

-- Contributors can submit only their own editable rows. The post remains private.
create or replace function public.submit_blog_post(p_post_id uuid)
returns public.blog_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_post public.blog_posts;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  update public.blog_posts
  set status = 'pending_review',
      submitted_at = now(),
      reviewer_note = null,
      reviewed_at = null,
      reviewed_by = null,
      featured = false,
      published_at = null,
      updated_by = v_uid,
      updated_at = now()
  where id = p_post_id
    and created_by = v_uid
    and status in ('draft','changes_requested','rejected')
  returning * into v_post;

  if v_post.id is null then
    raise exception 'Post is not available for submission';
  end if;

  return v_post;
end;
$$;

revoke all on function public.submit_blog_post(uuid) from public;
grant execute on function public.submit_blog_post(uuid) to authenticated;

-- Returns contributor identity only to the owner review UI. Email is never exposed
-- through the public Blog & GK catalogue.
create or replace function public.blog_review_queue()
returns table (
  id uuid,
  contributor_email text,
  contributor_username text,
  status text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_note text
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_blog_owner() then
    raise exception 'Owner approval permission required';
  end if;

  return query
  select bp.id, u.email::text, p.username::text, bp.status,
         bp.submitted_at, bp.reviewed_at, bp.reviewer_note
  from public.blog_posts bp
  left join auth.users u on u.id = bp.created_by
  left join public.profiles p on p.id = bp.created_by
  where bp.status in ('pending_review','changes_requested','rejected')
  order by bp.submitted_at desc nulls last, bp.updated_at desc;
end;
$$;

revoke all on function public.blog_review_queue() from public;
grant execute on function public.blog_review_queue() to authenticated;

create or replace function public.approve_blog_post(
  p_post_id uuid,
  p_note text default null,
  p_featured boolean default false
)
returns public.blog_posts
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_post public.blog_posts;
begin
  if not public.is_blog_owner() then
    raise exception 'Owner approval permission required';
  end if;

  update public.blog_posts
  set status = 'published', featured = coalesce(p_featured, false),
      published_at = now(), reviewed_at = now(), reviewed_by = auth.uid(),
      reviewer_note = nullif(left(trim(coalesce(p_note, '')), 2000), ''),
      updated_by = auth.uid(), updated_at = now()
  where id = p_post_id and status = 'pending_review'
  returning * into v_post;

  if v_post.id is null then
    raise exception 'Submission not found or is not waiting for review';
  end if;
  return v_post;
end;
$$;

create or replace function public.request_blog_changes(p_post_id uuid, p_note text)
returns public.blog_posts
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_note text := left(trim(coalesce(p_note, '')), 2000);
  v_post public.blog_posts;
begin
  if not public.is_blog_owner() then raise exception 'Owner approval permission required'; end if;
  if v_note = '' then raise exception 'Please add a note explaining the requested changes'; end if;
  update public.blog_posts
  set status = 'changes_requested', featured = false, published_at = null,
      reviewed_at = now(), reviewed_by = auth.uid(), reviewer_note = v_note,
      updated_by = auth.uid(), updated_at = now()
  where id = p_post_id and status = 'pending_review'
  returning * into v_post;
  if v_post.id is null then raise exception 'Submission not found or is not waiting for review'; end if;
  return v_post;
end;
$$;

create or replace function public.reject_blog_post(p_post_id uuid, p_note text)
returns public.blog_posts
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_note text := left(trim(coalesce(p_note, '')), 2000);
  v_post public.blog_posts;
begin
  if not public.is_blog_owner() then raise exception 'Owner approval permission required'; end if;
  if v_note = '' then raise exception 'Please add a reason for rejection'; end if;
  update public.blog_posts
  set status = 'rejected', featured = false, published_at = null,
      reviewed_at = now(), reviewed_by = auth.uid(), reviewer_note = v_note,
      updated_by = auth.uid(), updated_at = now()
  where id = p_post_id and status = 'pending_review'
  returning * into v_post;
  if v_post.id is null then raise exception 'Submission not found or is not waiting for review'; end if;
  return v_post;
end;
$$;

revoke all on function public.approve_blog_post(uuid,text,boolean) from public;
revoke all on function public.request_blog_changes(uuid,text) from public;
revoke all on function public.reject_blog_post(uuid,text) from public;
grant execute on function public.approve_blog_post(uuid,text,boolean) to authenticated;
grant execute on function public.request_blog_changes(uuid,text) to authenticated;
grant execute on function public.reject_blog_post(uuid,text) to authenticated;

-- Public reading stays unchanged. Contributors can upload only inside their auth
-- user-id folder; the owner can manage all blog images.
drop policy if exists blog_images_admin_insert on storage.objects;
drop policy if exists blog_images_admin_update on storage.objects;
drop policy if exists blog_images_admin_delete on storage.objects;
drop policy if exists blog_images_owner_insert on storage.objects;
drop policy if exists blog_images_owner_update on storage.objects;
drop policy if exists blog_images_owner_delete on storage.objects;
drop policy if exists blog_images_contributor_insert on storage.objects;
drop policy if exists blog_images_contributor_update on storage.objects;
drop policy if exists blog_images_contributor_delete on storage.objects;

create policy blog_images_owner_insert on storage.objects
for insert to authenticated with check (bucket_id = 'blog-images' and public.is_blog_owner());
create policy blog_images_owner_update on storage.objects
for update to authenticated
using (bucket_id = 'blog-images' and public.is_blog_owner())
with check (bucket_id = 'blog-images' and public.is_blog_owner());
create policy blog_images_owner_delete on storage.objects
for delete to authenticated using (bucket_id = 'blog-images' and public.is_blog_owner());

create policy blog_images_contributor_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'blog-images' and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy blog_images_contributor_update on storage.objects
for update to authenticated
using (bucket_id = 'blog-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'blog-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy blog_images_contributor_delete on storage.objects
for delete to authenticated
using (bucket_id = 'blog-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
