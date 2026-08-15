## 2026-08-15 - Open Graph & Twitter Card Image Metadata Completeness on Static Catalogues

**Finding:** `tools-catalog.html` was missing Open Graph image metadata (`og:image`, `og:image:width`, `og:image:height`, `og:image:alt`, `og:image:type`) and Twitter Card image metadata (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`), falling back to basic summary card rendering without visual social previews.

**Learning:** Static directory or fallback pages generated alongside main interactive tools pages can easily miss rich social media metadata if not included in the standard site template sync.

**Prevention:** Ensure static fallback pages include the complete suite of Open Graph and Twitter Card image tags pointing to canonical site social card assets (`/assets/media/poly-pmna-study-hub-social-card.png`).
