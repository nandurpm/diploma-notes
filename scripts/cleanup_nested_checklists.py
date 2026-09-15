#!/usr/bin/env python3
"""One-shot cleanup of nested checklist wrappers from the earlier repair pass."""
import re
import glob

n_files = 0
n_fixes = 0
for p in sorted(glob.glob("revision-2026-content/lessons/lessons-6*.html")):
    raw = open(p, encoding="utf-8").read()
    patA = re.compile(
        r'<ul class="checklist"><ul class="checklist">(.*?)</ul>\.(?:</ul>)',
        re.S,
    )
    new = patA.sub(lambda m: '<ul class="checklist">' + m.group(1) + "</ul>", raw)
    if new != raw:
        open(p, "w", encoding="utf-8").write(new)
        n_files += 1
        n_fixes += len(patA.findall(raw))

print("files fixed:", n_files, "wrappers unwrapped:", n_fixes)

left = 0
for p in sorted(glob.glob("revision-2026-content/lessons/lessons-6*.html")):
    raw = open(p, encoding="utf-8").read()
    left += len(re.findall(r'<ul class="checklist"><ul class="checklist">', raw))
print("nested wrappers left:", left)
