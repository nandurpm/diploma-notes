## 2026-03-01 - Git LFS Direct Media Handling

**Learning:** Statically hosted web projects stored using Git LFS (Large File Storage) require special handling for direct media and document links, as binary files like PDFs and video streams are committed only as small text pointer files in standard checkouts. Standard GitHub Pages or raw git branches will serve the pointer if requested directly, but appending and routing them via `media.githubusercontent.com` resolves and streams the actual assets seamlessly.

**Action:** Ensure dynamic fallbacks in custom download scripts check for local PDF existence, and fallback dynamically to the direct LFS Git CDN (`https://media.githubusercontent.com/...`) if binary checkout is bypassed.

## 2026-03-01 - Study Materials Alignment

**Learning:** Curricular transitions (e.g., from Revision 2021 to Revision 2026) introduce searchability gaps when landing/gateway pages do not surface active curriculum directories prominently.

**Action:** Align multi-revision landing pages to prioritize the active revision (Revision 2026) and designate legacy revisions transparently, preserving all direct access to learning resources.
