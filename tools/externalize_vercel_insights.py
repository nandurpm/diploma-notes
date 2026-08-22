from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
INLINE = re.compile(
    r'<script\s+type="module">\s*\n?\s*import\s+\{\s*injectSpeedInsights\s*\}\s+from\s+"https://cdn\.jsdelivr\.net/npm/@vercel/speed-insights@1/dist/index\.mjs";\s*\n?\s*injectSpeedInsights\(\);\s*\n?\s*</script>',
    re.MULTILINE,
)
REPLACEMENT = '<script type="module" src="/assets/js/vercel-insights.js?v=20260822-csp-fix1"></script>'

candidates = [ROOT / "model-question-papers.html", ROOT / "syllabus.html", ROOT / "contact.html", ROOT / "about.html"]
candidates += sorted((ROOT / "revision-2021").glob("*.html"))
candidates += sorted((ROOT / "revision-2026").glob("*.html"))
changed = []
for path in candidates:
    text = path.read_text(encoding="utf-8")
    updated, count = INLINE.subn(REPLACEMENT, text)
    if count:
        path.write_text(updated, encoding="utf-8")
        changed.append((str(path.relative_to(ROOT)), count))
print(f"Externalized {sum(count for _, count in changed)} inline modules across {len(changed)} pages.")
for name, count in changed:
    print(f"{name}: {count}")
