# Lighthouse Journal

This is the Lighthouse Journal for recording project-specific SEO patterns, crawlability constraints, metadata conventions, structured data decisions, and indexing lessons.

## 2026-07-28 - Image Optimization for Core Web Vitals

**Learning:** Large unoptimized image files used in site-wide structural components (such as a 1.1 MB header logo scaled down to 42x42px via CSS/attributes) trigger major `uses-responsive-images` Lighthouse audits. This severely degrades Largest Contentful Paint (LCP) and page speed across all pages. Resizing site-wide template assets to a standard high-DPI resolution (e.g., 128x128px) and running optimized compression minimizes resource size by >98% and instantly increases global performance scores.

**Action:** Ensure that all brand assets, icons, and site-wide template images are properly sized and compressed to avoid triggering unoptimized resource warnings in automated Lighthouse and site audit checks.
