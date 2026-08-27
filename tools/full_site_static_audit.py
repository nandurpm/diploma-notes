#!/usr/bin/env python3
"""Full-site static audit for POLY PMNA.

Accuracy rules (designed to avoid false positives):
 * Only ACTUAL resource references are inspected: href=, src=, poster=
   attribute values, stylesheet <link>s, and ES import specifiers in JS.
   Visible anchor TEXT is never treated as a URL.
 * Query-only references such as "?autoPrintNotes=1" are valid page-relative
   print parameters and never flagged.
 * Dynamic values (template literals "${...}", string concatenation "'+x+'",
   values containing whitespace) are skipped as non-resolvable by design.
 * External URLs (http/https/scheme-relative) are counted and reported
   separately, not checked against the local filesystem.
 * data-*-href attributes are informational only (runtime availability flags);
   they are scanned for policy violations but never resolved as file paths.

Checks:
 1. Missing local references (documents must resolve every static ref).
 2. Duplicate DOM ids per document.
 3. Metadata policy: exactly one absolute canonical on indexable documents;
    noindex+no-canonical on utility (404/offline), parameterized views
    (revision-202*/department-view.html); fragments exempt; canonical URLs
    must not carry query strings.
 4. Heading policy: exactly one H1 per genuine document.
 5. SITTTR policy: course-specific diploma-modelqp-courses-show links are
     accepted only when they carry a revision-specific scheme token; revision
     indexes must use an allowed scheme=REV20xx token.
 6. Cache-buster consistency: one current ?v= token per asset site-wide.

Exit code 0 = pass. Writes reports/FULL-SITE-STATIC-AUDIT.json.
"""
import json
import os
import re
import sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {"node_modules", ".git", ".claude", "reports", "maintenance", "docs"}
ORIGIN = "https://polypmna.dpdns.org"

REF_ATTR_RE = re.compile(
    r"""(?<![-\w.])(?:href|src|poster)\s*=\s*("([^"]*)"|'([^']*)')""", re.I)
CSS_LINK_RE = re.compile(r'<link[^>]*rel="stylesheet"[^>]*>', re.I)
ID_RE = re.compile(r'\bid\s*=\s*"([^"]+)"')
CANON_HREF_RE = re.compile(
    r'<link[^>]*rel="canonical"[^>]*href="([^"]+)"', re.I)
NOINDEX_RE = re.compile(
    r'<meta[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"', re.I)
H1_RE = re.compile(r"<h1[\s>]")
JS_IMPORT_RE = re.compile(
    r"""(?:import\s[^"';]*from\s*|import\s*\(\s*|require\s*\(\s*)(["'])([^"']+)\1""")
SCRIPT_SPAN_RE = re.compile(r"<script\b.*?</script\s*>", re.S | re.I)

EXTERNAL_RE = re.compile(r"^(?:[a-z][a-z0-9+.-]*://|//)", re.I)
SPECIAL_RE = re.compile(r"^(?:mailto:|tel:|javascript:|data:|#)", re.I)
DYNAMIC_RE = re.compile(r"[\s${]'")  # template/concatenated/whitespace-bearing


def iter_html():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel_dir = os.path.relpath(dirpath, ROOT)
        parts = [] if rel_dir == "." else rel_dir.split(os.sep)
        if any(p in SKIP_DIRS for p in parts):
            dirnames[:] = []
            continue
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn.endswith(".html"):
                yield os.path.join(dirpath, fn)


def classify(rel):
    parts = rel.split("/")
    if rel == "404.html" or parts[-1] == "offline.html":
        return "utility"
    if (len(parts) == 2 and parts[0] in ("revision-2021", "revision-2026")
            and parts[1] == "department-view.html"):
        return "view"
    return "document"


def norm_target(raw, page_dir):
    t = raw.strip().split("#", 1)[0]
    if not t or SPECIAL_RE.match(t) or EXTERNAL_RE.match(t):
        return None
    q_only = t.startswith("?")
    t = t.split("?", 1)[0]
    if q_only or not t:
        return "QUERY_ONLY"  # valid page-relative parameter
    if t.startswith("/"):
        # root-absolute: valid because the site serves from the domain root
        return t.lstrip("/")
    stack = [] if page_dir == "." else list(page_dir.split("/"))
    for seg in t.split("/"):
        if seg in ("", "."):
            continue
        if seg == "..":
            if stack:
                stack.pop()
            continue
        stack.append(seg)
    return "/".join(stack)


def is_document(raw):
    low = raw[:400].lower()
    return "<!doctype" in low or "<html" in raw[:2500].lower()


missing = defaultdict(set)          # target -> {pages}
dup_ids = {}                        # page -> {id: count}
meta_issues = []                    # (page, issue)
h1_issues = []                      # (page, issue)
broken_sitttr = []                  # (page, context)
cache_versions = defaultdict(set)
external_count = 0
query_only_refs = 0
docs = fragments = utilities = views = 0

for page in iter_html():
    rel = os.path.relpath(page, ROOT).replace(os.sep, "/")
    page_dir = os.path.dirname(rel) or "."
    raw = open(page, encoding="utf-8", errors="replace").read()
    head = raw[:raw.find("</head>")] if "</head>" in raw else raw[:6000]

    # duplicate ids (static DOM only; ignore ids inside script strings)
    noscript = SCRIPT_SPAN_RE.sub("", raw)
    ids = ID_RE.findall(noscript)
    dupes = {k: v for k, v in Counter(ids).items() if v > 1}
    if dupes:
        dup_ids[rel] = dupes

    if not is_document(raw):
        fragments += 1
        continue
    kind = classify(rel)
    if kind == "document":
        docs += 1
    elif kind == "view":
        views += 1
    else:
        utilities += 1

    # metadata policy
    canons = CANON_HREF_RE.findall(head)
    has_noindex = bool(NOINDEX_RE.search(head))
    if kind == "document":
        if len(canons) != 1:
            meta_issues.append((rel, f"canonical count={len(canons)}"))
        elif "?" in canons[0] or not canons[0].startswith(ORIGIN):
            meta_issues.append((rel, f"canonical not clean/absolute: {canons[0][:80]}"))
        n_h1 = len(H1_RE.findall(SCRIPT_SPAN_RE.sub("", raw)))
        if n_h1 != 1:
            h1_issues.append((rel, f"h1 count={n_h1}"))
    else:  # utility / view
        if canons:
            meta_issues.append((rel, f"{kind} must not carry a canonical"))
        if not has_noindex:
            meta_issues.append((rel, f"{kind} missing robots noindex"))

    # reference resolution (static DOM only; runtime-built refs inside
    # <script> are not statically resolvable and are skipped by design)
    static_dom = SCRIPT_SPAN_RE.sub("", raw)
    for m in REF_ATTR_RE.finditer(static_dom):
        val = (m.group(2) if m.group(2) is not None else m.group(3) or "").strip()
        # skip JS string concatenation around the quoted value
        before = static_dom[m.start() - 1] if m.start() > 0 else ""
        after = static_dom[m.end()] if m.end() < len(static_dom) else ""
        if before == "+" or after == "+":
            continue
        if not val:
            continue
        if EXTERNAL_RE.match(val):
            external_count += 1
            continue
        tgt = norm_target(val, page_dir)
        if tgt is None:
            continue
        if tgt == "QUERY_ONLY":
            query_only_refs += 1
            continue
        if DYNAMIC_RE.search(val):
            continue  # runtime-built value; not statically resolvable
        p = os.path.join(ROOT, tgt)
        ok = os.path.isfile(p) or (
            not os.path.splitext(p)[1]
            and (os.path.isfile(p + ".html") or os.path.isdir(p)))
        if not ok:
            missing[tgt].add(rel)
        vm = re.match(r"^assets/(?:js|css)/[^?#]+\.(\w+)(?:\?v=([\w.-]+))?$", tgt)
        if vm and "?v=" in val:
            cache_versions["/assets/" +
                            tgt.split("assets/", 1)[1].split("?v=")[0]].add(
                                val.split("?v=", 1)[1])

    # stylesheet links without version tokens still resolve; nothing to do here

    # SITTTR policy on served pages
    if "diploma-modelqp-courses-show" in raw and not re.search(
            r"diploma-modelqp-courses-show[^\"']*(?:&amp;|&)scheme=REV(?:2015|2021|2026)",
            raw,
            re.I,
    ):
        broken_sitttr.append((rel, "course-specific model-paper route missing revision scheme"))
    for bad in re.findall(r'scheme=REV([0-9]{4})', raw):
        if bad not in {"1997", "2003", "2006", "2010", "2015", "2021", "2026"}:
            broken_sitttr.append((rel, f"scheme token REV{bad}"))

# JS module imports (local specifiers only)
for sub in ("assets", "scripts", "."):
    base = os.path.join(ROOT, sub)
    if not os.path.isdir(base):
        continue
    for dirpath, dirnames, filenames in os.walk(base):
        parts = os.path.relpath(dirpath, ROOT).split(os.sep)
        if any(p in SKIP_DIRS for p in parts):
            dirnames[:] = []
            continue
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if not fn.endswith(".js"):
                continue
            jp = os.path.join(dirpath, fn)
            src = open(jp, encoding="utf-8", errors="replace").read()
            for m in JS_IMPORT_RE.finditer(src):
                spec = m.group(2).strip()
                if (not spec.startswith(".")
                        or EXTERNAL_RE.match(spec) or DYNAMIC_RE.search(spec)):
                    continue
                base_dir = os.path.dirname(jp)
                cand = os.path.normpath(os.path.join(base_dir, spec))
                if not any(os.path.isfile(cand + ext) for ext in ("", ".js", ".mjs", "/index.js")):
                    missing[os.path.relpath(cand, ROOT)].add(
                        os.path.relpath(jp, ROOT))

conflicts = {k: sorted(v) for k, v in cache_versions.items() if len(v) > 1}

report = {
    "generated": "static audit",
    "documents": docs,
    "fragments": fragments,
    "utilities": utilities,
    "views": views,
    "missingLocalReferences": {k: sorted(v)[:5]
                               for k, v in sorted(missing.items(),
                                                  key=lambda kv: -len(kv[1]))},
    "duplicateIds": dup_ids,
    "metadataIssues": meta_issues,
    "headingIssues": h1_issues,
    "sitttrPolicyViolations": broken_sitttr,
    "cacheVersionConflicts": conflicts,
    "externalReferencesCounted": external_count,
    "queryOnlyRefsAccepted": query_only_refs,
}
os.makedirs(os.path.join(ROOT, "reports"), exist_ok=True)
with open(os.path.join(ROOT, "reports", "FULL-SITE-STATIC-AUDIT.json"), "w",
          encoding="utf-8") as f:
    json.dump(report, f, indent=2)

fail = any([missing, dup_ids, meta_issues, h1_issues, broken_sitttr, conflicts])
print(f"documents={docs} fragments={fragments} utilities={utilities} views={views}")
print(f"missing local references : {len(missing)}")
print(f"duplicate-ID documents   : {len(dup_ids)}")
print(f"metadata policy issues   : {len(meta_issues)}")
print(f"heading policy issues    : {len(h1_issues)}")
print(f"SITTTR policy violations : {len(broken_sitttr)}")
print(f"cache-version conflicts  : {len(conflicts)}")
print(f"external refs (reported, not resolved): {external_count}")
print(f"query-only refs accepted : {query_only_refs}")
sys.exit(1 if fail else 0)
