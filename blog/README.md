# POLY PMNA Blog & GK publishing guide

The normal publishing workflow no longer requires editing HTML or JSON.

## Daily publishing — recommended

1. Open `/admin/blog.html` on the deployed site.
2. Sign in with the POLY PMNA account that has the `admin` role.
3. Click **+ New post**.
4. Enter the title, choose a category, add a short description and write the article with the formatting toolbar.
5. Optionally add a cover image and mark the post as featured.
6. Use **Preview** to check it.
7. Click **Save draft** if it is not ready, or **Publish** to make it public immediately.

Published posts appear automatically on `/blog.html`. No repository edit is required for ordinary daily publishing.

## Editing existing posts

Open `/admin/blog.html`, choose the post from the left-hand list, make the changes and click **Publish** again. Use **Unpublish** to remove a post from the public blog while keeping it as a draft. Use **Delete** only when the post should be permanently removed.

## Supported categories

- `Study Topics`
- `General Knowledge`
- `Daily Blogs`
- `Exam Tips`
- `Announcements`

## Images

The publisher accepts JPEG, PNG, WebP and AVIF cover images up to 5 MB. Images are stored in the public `blog-images` Supabase Storage bucket. Always add a short image description for accessibility.

## Architecture

Admin-created posts are stored in the Supabase `blog_posts` table. Row-level security allows public users to read only published posts and allows only authenticated users whose `profiles.role` is `admin` to create, edit, unpublish or delete posts.

The original static post workflow remains in the repository as a fallback for hand-authored permanent pages. `/data/blog-index.json` and `blog/post-template.html.example` are therefore retained, but they are not needed for normal daily publishing.

## Writing and source rules

- Keep posts original and useful to students.
- Do not present unofficial information as an official SITTTR notice.
- Link to authoritative sources when a claim depends on an official notice, syllabus or circular.
- Check facts before publishing GK/current-affairs posts.
- Do not move existing POLY PMNA public pages. Blog & GK is additive and must not break existing URLs.
