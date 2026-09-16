# POLY PMNA Blog & GK publishing guide

The normal publishing workflow no longer requires editing HTML or JSON.

## Daily publishing — recommended

1. Open `/admin/blog.html` on the deployed site.
2. Sign in with the POLY PMNA account that has the `admin` role.
3. Click **+ New post**.
4. Enter the title, choose a category, add a short description and write the article.
5. Use the formatting toolbar for bold, italic, underline, strikethrough, highlight, headings, lists, quotes, code blocks, dividers, links and alignment.
6. Optionally add or replace a cover image.
7. Open **Advanced settings & SEO** for author name, language, SEO title, SEO description, source/reference and featured-post settings.
8. Use **Preview** to check it.
9. Click **Save draft** if it is not ready, or **Publish** to make it public immediately.

Published posts appear automatically on `/blog.html`. No repository edit is required for ordinary daily publishing.

## Editing existing posts

Open `/admin/blog.html`, choose the post from the left-hand list, make the changes and click **Publish** again. Use **Unpublish** to remove a post from the public blog while keeping it as a draft. Use **Delete** only when the post should be permanently removed.

The post list can be searched and filtered by status or category. The dashboard shows total, published, draft and featured counts.

## Unsaved-work recovery

While typing, the publisher stores a recovery snapshot in the current browser. If the page is accidentally refreshed or closed before saving, the editor offers to restore that local draft when the admin page is reopened. This local recovery is not a published post and should not replace **Save draft** for important work.

## Supported categories

- `Study Topics`
- `General Knowledge`
- `Daily Blogs`
- `Exam Tips`
- `Announcements`

## Images

The publisher accepts JPEG, PNG, WebP and AVIF cover images up to 5 MB. Images are stored in the public `blog-images` Supabase Storage bucket. The editor shows a cover preview and supports replacing or removing the current cover. Always add a short image description for accessibility.

## Advanced metadata

Each admin-created post can optionally store:

- SEO title (up to 70 characters)
- SEO description (up to 180 characters)
- author name
- language: English, Malayalam or mixed
- source/reference label and URL
- featured-post status

The public article page uses the SEO fields when supplied and falls back to the normal title and short description otherwise.

## Architecture

Admin-created posts are stored in the Supabase `blog_posts` table. Row-level security allows public users to read only published posts and allows only authenticated users whose `profiles.role` is `admin` to create, edit, unpublish or delete posts.

The original static post workflow remains in the repository as a fallback for hand-authored permanent pages. `/data/blog-index.json` and `blog/post-template.html.example` are therefore retained, but they are not needed for normal daily publishing.

## Writing and source rules

- Keep posts original and useful to students.
- Do not present unofficial information as an official SITTTR notice.
- Link to authoritative sources when a claim depends on an official notice, syllabus or circular.
- Check facts before publishing GK/current-affairs posts.
- Do not move existing POLY PMNA public pages. Blog & GK is additive and must not break existing URLs.
