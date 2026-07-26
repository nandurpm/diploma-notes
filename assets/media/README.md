# Media Assets

Static media files (images, SVGs, videos) used across the POLY PMNA portal.

## Directory Structure

| Subdirectory | Contents | Count |
|--------------|----------|-------|
| `brands/` | Brand logos, partner logos, department icons | ~50 |
| `departments/` | Department artwork and banners | ~20 |
| `departments/rev2026/` | Revision 2026 department-specific artwork (WebP) | ~39 |
| `logos/` | Site logos in various formats and sizes | ~10 |
| `icons/` | UI icons and illustrations | ~15 |
| `banners/` | Hero banners and promotional images | ~10 |
| `guide/` | Step-by-step guide screenshots and images | ~20 |
| `lessons/` | Lesson-specific diagrams and illustrations | ~500 |
| `tools/` | Tool page screenshots and diagrams | ~20 |
| Root | Favicon, default images | ~5 |

## Key Files

| File | Used By | Purpose |
|------|---------|---------|
| `poly-pmna-logo.png` | `site-shell.js` | Primary site logo displayed in the header. |
| `poly-pmna-favicon.svg` | `site-shell.js` | SVG favicon for the site. |
| `departments/rev2026/*.webp` | `revision-2026-browser.js` | Department-specific artwork shown on programme cards. |

## Media Guidelines

- Prefer WebP format for photographic images (better compression)
- Use SVG for logos and icons (scalable, small file size)
- Keep image file sizes under 500 KB where possible
- Lesson images are named with the course code prefix for organization
