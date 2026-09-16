create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 160),
  category text not null check (category in ('Study Topics','General Knowledge','Daily Blogs','Exam Tips','Announcements')),
  summary text not null check (char_length(summary) between 10 and 500),
  content_html text not null check (char_length(content_html) between 1 and 100000),
  cover_url text,
  cover_alt text,
  tags text[] not null default '{}',
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_public_idx on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_category_idx on public.blog_posts (category, published_at desc);

alter table public.blog_posts enable row level security;

drop policy if exists blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read on public.blog_posts
for select to anon, authenticated
using (status = 'published' and published_at is not null and published_at <= now());

drop policy if exists blog_posts_admin_select on public.blog_posts;
create policy blog_posts_admin_select on public.blog_posts
for select to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists blog_posts_admin_insert on public.blog_posts;
create policy blog_posts_admin_insert on public.blog_posts
for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists blog_posts_admin_update on public.blog_posts;
create policy blog_posts_admin_update on public.blog_posts
for update to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists blog_posts_admin_delete on public.blog_posts;
create policy blog_posts_admin_delete on public.blog_posts
for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images','blog-images',true,5242880,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists blog_images_public_read on storage.objects;
create policy blog_images_public_read on storage.objects
for select to public
using (bucket_id = 'blog-images');

drop policy if exists blog_images_admin_insert on storage.objects;
create policy blog_images_admin_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'blog-images'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

drop policy if exists blog_images_admin_update on storage.objects;
create policy blog_images_admin_update on storage.objects
for update to authenticated
using (
  bucket_id = 'blog-images'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
)
with check (
  bucket_id = 'blog-images'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

drop policy if exists blog_images_admin_delete on storage.objects;
create policy blog_images_admin_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'blog-images'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);
