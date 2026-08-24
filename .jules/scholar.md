# Scholar's Journal - Critical Learnings

## 2026-08-14 - Synchronizing Subject Title Typo Fixes Across Materialized Pages and Search Indexes
**Finding:** Typographical spelling errors in course names (such as "Linear Integared Ciricuits" for course 5501 in `assets/js/subjects.js`) propagate into static Revision 2021 department HTML pages and Ask POLY AI search indexes.
**Learning:** Fixing subject titles in `assets/js/subjects.js` alone is insufficient because department pages in `revision-2021/` contain materialized subject cards and `assets/data/ask-poly-knowledge.json` contains a pre-built retrieval index.
**Prevention:** Whenever subject metadata in `assets/js/subjects.js` is corrected, always execute `tools/materialize_rev2021_subjects.py` and `tools/build_ask_poly_knowledge.py` to keep rendered HTML pages and chatbot search indices synchronized.
