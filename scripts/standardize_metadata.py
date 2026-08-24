#!/usr/bin/env python3
"""Standardize <link rel="canonical"> and H1 policy for every HTML document.

POLICY
-----
FRAGMENT   File has no <!DOCTYPE html> / <html> element (partial include).
           -> Not a document; excluded from canonical/H1 rules entirely.
UTILITY    404.html, offline.html, android-app offline asset: rendered for
           arbitrary requests or offline shells.
           -> <meta name="robots" content="noindex"> REQUIRED,
              canonical link FORBIDDEN (a fixed canonical on a variable-
              response page is misleading to crawlers).
VIEW       revision-202*/department-view.html: renders any department from a
           query string; the indexed per-department pages are the static ones.
           -> Same rule as UTILITY (noindex + no canonical).
DOCUMENT   Every other full HTML page.
           -> Exactly ONE absolute canonical built from the clean public
              pathname (query strings stripped; index.html -> directory root).
           -> Exactly ONE meaningful H1. Pages without one get a visible,
              inline-styled H1 derived from course meta/title tags inserted
              before the first static heading. Extra JS-template H1s must be
              demoted manually (handled separately for known cases).

Idempotent. Prints a per-action summary.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {"node_modules", ".git", ".claude", "reports", "maintenance", "docs"}
SITE_ORIGIN = "https://polypmna.dpdns.org"
CANON_RE = re.compile(r'<link[^>]*rel="canonical"[^>]*>\s*', re.I)
H1_RE = re.compile(r"<h1[\s>]")
SCRIPT_END_RE = re.compile(r"</script\s*>", re.I)
NOINDEX_RE = re.compile(r'<meta[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"', re.I)

def classify(rel):
    parts = rel.split("/")
    if parts[0] == "404.html" or parts[-1] == "offline.html":
        return "utility"
    if len(parts) == 2 and parts[0] in ("revision-2021", "revision-2026") and parts[1] == "department-view.html":
        return "view"
    return "document"

def clean_canonical(rel):
    path = rel[:-len("index.html")] if rel.endswith("index.html") else rel
    return f"{SITE_ORIGIN}/{path}"

def ensure_noindex(head):
    if NOINDEX_RE.search(head):
        return head, False
    tag = '<meta name="robots" content="noindex">'
    if "</title>" in head:
        return head.replace("</title>", "</title>" + tag, 1), True
    return tag + head, True

def insert_after_title(doc, snippet):
    if "</title>" in doc:
        return doc.replace("</title>", "</title>" + snippet, 1), True
    m = re.search(r'<meta[^>]*charset[^>]*>', doc, re.I)
    if m:
        i = m.end()
        return doc[:i] + snippet + doc[i:], True
    return None, False

stats = {"fragment": 0, "utility": 0, "view": 0, "document": 0}
actions = {"canon_added": 0, "canon_kept": 0, "noindex_added": 0, "canonical_stripped": 0,
           "h1_added": 0, "h1_present": 0}
h1_missing_docs = []

for dirpath, dirnames, filenames in os.walk(ROOT):
    rel_dir = os.path.relpath(dirpath, ROOT)
    parts = [] if rel_dir == "." else rel_dir.split(os.sep)
    if any(p in SKIP_DIRS for p in parts):
        dirnames[:] = []
        continue
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    for fn in filenames:
        if not fn.endswith(".html"):
            continue
        p = os.path.join(dirpath, fn)
        rel = os.path.relpath(p, ROOT).replace(os.sep, "/")
        raw = open(p, encoding="utf-8", errors="replace").read()
        low = raw[:400].lower()
        if "<!doctype" not in low and "<html" not in raw[:2500].lower():
            stats["fragment"] += 1
            continue
        kind = classify(rel)
        stats[kind] += 1
        original = raw
        head_split = raw.find("</head>")
        head = raw[:head_split] if head_split != -1 else raw[:6000]

        if kind in ("utility", "view"):
            n_canon = len(CANON_RE.findall(head))
            if n_canon:
                raw = CANON_RE.sub("", raw)
                actions["canonical_stripped"] += n_canon
            new_head, added = ensure_noindex(raw[:head_split] if head_split != -1 else raw)
            if added:
                actions["noindex_added"] += 1
                raw = (new_head + raw[len(head):]) if head_split != -1 else new_head
        else:
            canon = f'<link rel="canonical" href="{clean_canonical(rel)}">'
            found = CANON_RE.findall(head)
            if found:
                actions["canon_kept"] += 1
                # normalize href to clean pathname (strip any query) and dedupe
                first = found[0]
                href_m = re.search(r'href="([^"]+)"', first)
                keep = canon
                if href_m:
                    clean = href_m.group(1).split("?", 1)[0]
                    keep = f'<link rel="canonical" href="{clean}">'
                raw = CANON_RE.sub("", raw)
                ins_at = raw.find("</title>")
                if ins_at != -1:
                    ins_at += len("</title>")
                    raw = raw[:ins_at] + keep + raw[ins_at:]
                else:
                    raw = re.sub(r'(<meta[^>]*charset[^>]*>)', r"\1" + keep, raw, count=1, flags=re.I)
                if len(found) > 1:
                    actions["canonical_stripped"] += len(found) - 1
                else:
                    actions["canon_kept"] -= 0  # normalized in place, not an add
            else:
                ok = insert_after_title(raw, canon)
                if ok[0] is not None:
                    raw = ok[0]
                    actions["canon_added"] += 1
            if not H1_RE.search(raw):
                h1_missing_docs.append((rel, raw))

        if raw != original:
            open(p, "w", encoding="utf-8", newline="").write(raw)

# H1 insertion pass for documents still lacking one
def static_anchor(doc):
    """First <h2>/<section>/<main>/<p class=kicker position outside <script> blocks."""
    spans = [(m.start(), m.end()) for m in re.finditer(r"<script\b.*?</script\s*>", doc, re.S | re.I)]
    def outside(pos):
        return not any(s <= pos < e for s, e in spans)
    best = -1
    for pat in ("<h2", "<h3", "<section", "<main"):
        start = 0
        while True:
            i = doc.find(pat, start)
            if i == -1:
                break
            if outside(i):
                if best == -1 or i < best:
                    best = i
                break
            start = i + 1
    return best

for rel, raw in h1_missing_docs:
    p = os.path.join(ROOT, rel)
    title_m = re.search(r"<title>(.*?)</title>", raw, re.S)
    title = title_m.group(1).strip() if title_m else ""
    code_m = re.search(r'<meta[^>]*name="course-code"[^>]*content="([^"]*)"', raw)
    ct_m = re.search(r'<meta[^>]*name="course-title"[^>]*content="([^"]*)"', raw)
    rev_m = re.search(r'<meta[^>]*name="revision"[^>]*content="([^"]*)"', raw)
    if code_m and ct_m:
        label = f"Course {code_m.group(1)} — {ct_m.group(1)}"
    elif title:
        label = re.sub(r"\s*\|\s*(REV20\d\d\s*)?\|?\s*POLY PMNA\s*$", "", title)
        label = re.sub(r"\s*\|\s*REV20\d\d\s*$", "", label)
    else:
        label = os.path.splitext(os.path.basename(rel))[0]
    h1 = f'\n<h1 style="font-size:1.55rem;line-height:1.28;margin:.35rem 0 .8rem;color:#0f172a">{label}</h1>\n'
    anchor = static_anchor(raw)
    if anchor == -1:
        print(f"  !! no insertion point for {rel}")
        continue
    raw = raw[:anchor] + h1 + raw[anchor:]
    open(p, "w", encoding="utf-8", newline="").write(raw)
    actions["h1_added"] += 1

print(f"classification: {stats}")
print(f"actions: {actions}")
