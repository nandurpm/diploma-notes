## 2026-08-15 - Open Graph & Twitter Card Image Metadata Completeness on Static Catalogues

**Finding:** `tools-catalog.html` was missing Open Graph image metadata (`og:image`, `og:image:width`, `og:image:height`, `og:image:alt`, `og:image:type`) and Twitter Card image metadata (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`), falling back to basic summary card rendering without visual social previews.

**Learning:** Static directory or fallback pages generated alongside main interactive tools pages can easily miss rich social media metadata if not included in the standard site template sync.

**Prevention:** Ensure static fallback pages include the complete suite of Open Graph and Twitter Card image tags pointing to canonical site social card assets (`/assets/media/poly-pmna-study-hub-social-card.png`).

## 2026-08-30 - Intrinsic Image Dimensions for Cumulative Layout Shift (CLS) Prevention

**Finding:** Guide screenshot images on `about.html` possessed `loading="lazy"` attributes but lacked explicit HTML `width` and `height` attributes, causing cumulative layout shifts (CLS) when images loaded lazily during scrolling.

**Learning:** `loading="lazy"` without explicit width and height dimensions prevents browsers from reserving the correct aspect ratio box in the DOM before asset fetch, causing content reflow as images load asynchronously.

**Prevention:** Always pair `loading="lazy"` image tags with exact intrinsic `width` and `height` attributes to enable aspect-ratio layout reservation and maintain zero Cumulative Layout Shift.

## 2026-09-20 - Canonical Policy Enforcement for Utility vs. Document HTML Pages

**Finding:** Adding a canonical URL to `offline.html` triggered a metadata policy violation in `tools/full_site_static_audit.py`.

**Learning:** Static audit rules classify non-indexable utility/fallback pages (`404.html`, `offline.html`) separately from regular documents, explicitly requiring utility pages NOT to carry canonical tags while still supporting full Open Graph and Twitter Card social cards.

**Prevention:** Check `classify()` in `tools/full_site_static_audit.py` before adding canonical tags to utility pages, ensuring social media preview metadata is present without violating canonical page classification rules.
