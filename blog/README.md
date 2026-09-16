# POLY PMNA Blog & GK publishing guide

The public catalogue lives at `/blog.html`. Individual published posts live under `/blog/`, while catalogue metadata lives in `/data/blog-index.json`.

## Publish a new post

1. Copy `blog/post-template.html.example` to `blog/<slug>.html`.
2. Replace every `REPLACE_*` placeholder in the copied file.
3. Use exactly one page `<h1>` and a unique title, description and canonical URL.
4. Add one object for the post to `data/blog-index.json`.
5. If the post uses a cover image, store an optimized WebP/AVIF/JPEG under `assets/images/blog/`, include its local path in the JSON as `thumbnail`, and use meaningful alt text as `thumbnailAlt`.
6. Keep the date in `YYYY-MM-DD` format. The catalogue sorts newer dates first automatically.
7. Run the normal repository quality checks. `tools/generate_sitemap.py` includes new canonical `.html` posts in `sitemap.xml`.
8. Push the branch / open a pull request. After the normal deployment completes, the post appears in the catalogue automatically.

## Supported categories

Use one of these exact values:

- `Study Topics`
- `General Knowledge`
- `Daily Blogs`
- `Exam Tips`
- `Announcements`

## Catalogue object

```json
{
  "id": "unique-stable-id",
  "title": "Human-readable post title",
  "slug": "human-readable-post-title",
  "category": "Study Topics",
  "date": "2026-09-16",
  "summary": "A short plain-text summary used on catalogue cards.",
  "url": "/blog/human-readable-post-title.html",
  "thumbnail": "/assets/images/blog/human-readable-post-title.webp",
  "thumbnailAlt": "Description of the cover image",
  "featured": false,
  "tags": ["keyword", "another keyword"]
}
```

`thumbnail` and `thumbnailAlt` are optional. If no thumbnail is supplied, the blog UI displays the POLY PMNA category placeholder instead of a broken image.

Only one post normally needs `"featured": true`. If more than one is marked, the newest matching featured post is used.

## Writing and source rules

- Keep posts original and useful to students.
- Do not present unofficial information as an official SITTTR notice.
- Link directly to authoritative sources when a claim depends on an official notice, syllabus or circular.
- Do not put scripts or HTML inside `blog-index.json`; the catalogue renderer treats metadata as plain text.
- Do not move existing POLY PMNA public pages. Blog & GK is additive and must not break existing URLs.
