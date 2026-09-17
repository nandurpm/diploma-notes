#!/usr/bin/env python3
"""Normalize cache-buster versions: for every /assets/{js,css} asset referenced
with conflicting ?v= tokens across HTML pages, rewrite ALL references to the
latest (lexicographically greatest date-prefixed) token. Idempotent."""
import os
import re
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {"node_modules", ".git", ".claude", "reports", "maintenance"}
REF_RE = re.compile(r'((?:/assets/(?:js|css)/)[A-Za-z0-9._-]+\.(?:js|css))\?v=([A-Za-z0-9._-]+)')

versions = defaultdict(set)
files = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    rel_dir = os.path.relpath(dirpath, ROOT)
    parts = [] if rel_dir == "." else rel_dir.split(os.sep)
    if any(p in SKIP_DIRS for p in parts):
        dirnames[:] = []
        continue
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    for fn in filenames:
        if fn.endswith(".html"):
            files.append(os.path.join(dirpath, fn))

for p in files:
    raw = open(p, encoding="utf-8", errors="replace").read()
    for m in REF_RE.finditer(raw):
        versions[m.group(1)].add(m.group(2))

latest = {}
conflicts = {}
for path, vs in versions.items():
    win = max(vs)
    latest[path] = win
    if len(vs) > 1:
        conflicts[path] = (win, sorted(vs))

changed_files = 0
total_subs = 0
for p in files:
    raw = open(p, encoding="utf-8", errors="replace").read()
    def sub(m):
        return f"{m.group(1)}?v={latest.get(m.group(1), m.group(2))}"
    new, n = REF_RE.subn(sub, raw)
    if n and new != raw:
        open(p, "w", encoding="utf-8", newline="").write(new)
        changed_files += 1
        total_subs += n

print(f"assets referenced: {len(versions)}")
print(f"conflicted assets normalized: {len(conflicts)}")
for path, (win, allv) in sorted(conflicts.items()):
    print(f"  {path} -> ?v={win}  (had {len(allv)} variants)")
print(f"pages rewritten: {changed_files}, total substitutions: {total_subs}")
