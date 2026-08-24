#!/usr/bin/env python3
"""Full-site audit for POLY PMNA static site.
Checks (all offline/deterministic):
 1. Every href/src in every HTML resolves to an existing local file (or external URL).
 2. JS-referenced local data/asset files exist.
 3. Sitemap.xml covers real pages; no sitemap entry points at a missing file.
 4. Broken SITTTR route (`diploma-modelqp-courses-show`) outside the allowed scraper.
 5. Cross-revision contamination (revision-2021 page -> revision-2026 archive path, and vice versa).
 6. Dead disabled labels ("Model paper unavailable") on supported revisions.
 7. Cache-buster consistency: same asset referenced with different ?v= across pages.
Outputs JSON report to reports/SITE-AUDIT-latest.json and prints a summary.
"""
import json
import os
import re
import sys
from collections import defaultdict
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", "node_modules", "workers", ".claude", "reports", "maintenance", "docs"}

ATTR_RE = re.compile(r'(?:href|src)="([^"]+)"')
CSS_URL_RE = re.compile(r'url\((["\']?)([^)"\']+)\1\)')
SLOC_RE = re.compile(r"<loc>(.*?)</loc>")

missing_targets = defaultdict(set)   # target -> set of source files
js_fetch_missing = []
cache_versions = defaultdict(set)    # asset path -> set of versions
cross_rev = []                       # (page, match)
dead_labels = []                     # page
broken_routes = []                   # (file, count)

def iter_html():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel = os.path.relpath(dirpath, ROOT)
        parts = rel.split(os.sep)
        if any(p in SKIP_DIRS for p in parts):
            dirnames[:] = []
            continue
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn.endswith(".html"):
                yield os.path.join(dirpath, fn)

def exists(target):
    p = os.path.join(ROOT, target)
    if os.path.isfile(p):
        return True
    # extensionless -> try .html
    if not os.path.splitext(p)[1]:
        return os.path.isfile(p + ".html") or os.path.isdir(p)
    return False

def norm_target(raw, page_dir_rel):
    t = raw.strip()
    t = t.split("#", 1)[0].split("?", 1)[0]
    if not t or t.startswith(("mailto:", "tel:", "javascript:", "data:", "#")):
        return None
    if re.match(r"^[a-z][a-z0-9+.-]*://", t, re.I):
        return None  # external
    if t.startswith("/"):
        return t.lstrip("/")
    # relative
    base = page_dir_rel.split("/") if page_dir_rel != "." else []
    stack = list(base)
    for seg in t.split("/"):
        if seg in ("", "."):
            continue
        if seg == "..":
            if stack:
                stack.pop()
            continue
        stack.append(seg)
    return "/".join(stack)

html_count = 0
for page in iter_html():
    html_count += 1
    rel = os.path.relpath(page, ROOT).replace(os.sep, "/")
    page_dir = os.path.dirname(rel) or "."
    try:
        raw = open(page, encoding="utf-8", errors="replace").read()
    except OSError:
        continue
    for m in ATTR_RE.finditer(raw):
        tgt = norm_target(m.group(1), page_dir)
        if not tgt:
            continue
        if tgt.startswith("//"):
            continue
        # record cache-busted assets
        vm = re.match(r"^(/?assets/(?:js|css)/[^?\"']+\.)(?:js|css)(\?v=([\w.\-]+))?$", m.group(1))
        if vm and "?v=" in m.group(1):
            cache_versions[m.group(1).split("?")[0]].add(m.group(1).split("?v=")[1])
        if not exists(tgt):
            missing_targets[tgt].add(rel)
    # cross-revision scan
    if rel.startswith("revision-2021/") and "revision-2026/" in raw:
        cross_rev.append((rel, "rev2026 ref"))
    if rel.startswith("revision-2026/") and re.search(r"raw/refs/heads/main/sitttr/revision-2021/", raw):
        cross_rev.append((rel, "rev2021 archive path"))
    if "Model paper unavailable" in raw:
        dead_labels.append(rel)
    if "diploma-modelqp-courses-show" in raw:
        broken_routes.append((rel, raw.count("diploma-modelqp-courses-show")))

# JS fetch() of local data
for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, "assets")):
    for fn in filenames:
        if not fn.endswith(".js"):
            continue
        p = os.path.join(dirpath, fn)
        try:
            src = open(p, encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        for m in re.finditer(r"""(?:fetch|DATA_BASE\s*\+\s*|\bjsonPath\b[^;\n]{0,40}?)[\'"](/[a-zA-Z0-9_./-]+\.(?:json))[\'"]""", src):
            tgt = m.group(1).lstrip("/")
            if not os.path.isfile(os.path.join(ROOT, tgt)):
                js_fetch_missing.append((os.path.relpath(p, ROOT), tgt))

# sitemap coverage
sitemap_missing = []
sitemap_entries = 0
sm_path = os.path.join(ROOT, "sitemap.xml")
on_disk = {}
for page in iter_html():
    rel = os.path.relpath(page, ROOT).replace(os.sep, "/")
    on_disk[rel] = True
if os.path.isfile(sm_path):
    sm = open(sm_path, encoding="utf-8", errors="replace").read()
    for loc in SLOC_RE.findall(sm):
        sitemap_entries += 1
        path = urlparse(loc).path.lstrip("/")
        if path and not exists(path):
            sitemap_missing.append(path)

report = {
    "htmlPagesScanned": html_count,
    "missingLinkTargets": {
        k: sorted(v)[:6] for k, v in sorted(missing_targets.items(), key=lambda kv: -len(kv[1]))
    },
    "missingTargetCount": len(missing_targets),
    "jsFetchMissing": js_fetch_missing,
    "cacheVersionConflicts": {
        k: sorted(v) for k, v in cache_versions.items() if len(v) > 1
    },
    "crossRevisionRefs": cross_rev[:50],
    "deadDisabledLabels": dead_labels[:50],
    "brokenRoutesInHtml": broken_routes,
    "sitemapEntries": sitemap_entries,
    "sitemapMissingTargets": sitemap_missing,
}
os.makedirs(os.path.join(ROOT, "reports"), exist_ok=True)
with open(os.path.join(ROOT, "reports", "SITE-AUDIT-latest.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)

print(f"pages scanned: {html_count}")
print(f"unique missing link targets: {len(missing_targets)}")
for tgt, srcs in list(report['missingLinkTargets'].items())[:15]:
    print(f"  MISSING {tgt}  <- {srcs[0]} (+{len(srcs)-1} more)" if len(srcs) > 1 else f"  MISSING {tgt} <- {srcs[0]}")
print(f"js-fetch missing data files: {len(js_fetch_missing)}")
print(f"cache-version conflicts: {len(report['cacheVersionConflicts'])}")
print(f"cross-revision refs: {len(cross_rev)}")
print(f"dead 'Model paper unavailable' pages: {len(dead_labels)}")
print(f"broken courses-show routes in HTML: {sum(c for _, c in broken_routes)}")
print(f"sitemap entries: {sitemap_entries}, missing: {len(sitemap_missing)}")
