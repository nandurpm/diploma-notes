alter table public.blog_posts
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists author_name text not null default 'POLY PMNA',
  add column if not exists content_language text not null default 'en',
  add column if not exists source_label text,
  add column if not exists source_url text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'blog_posts_seo_title_len') then
    alter table public.blog_posts add constraint blog_posts_seo_title_len check (seo_title is null or char_length(seo_title) <= 70);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'blog_posts_seo_description_len') then
    alter table public.blog_posts add constraint blog_posts_seo_description_len check (seo_description is null or char_length(seo_description) <= 180);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'blog_posts_author_name_len') then
    alter table public.blog_posts add constraint blog_posts_author_name_len check (char_length(author_name) between 1 and 80);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'blog_posts_content_language_check') then
    alter table public.blog_posts add constraint blog_posts_content_language_check check (content_language in ('en','ml','mixed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'blog_posts_source_label_len') then
    alter table public.blog_posts add constraint blog_posts_source_label_len check (source_label is null or char_length(source_label) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'blog_posts_source_url_len') then
    alter table public.blog_posts add constraint blog_posts_source_url_len check (source_url is null or char_length(source_url) <= 500);
  end if;
end $$;
