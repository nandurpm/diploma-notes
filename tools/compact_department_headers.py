#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
DEPARTMENT_DIR = ROOT / "revision-2021"
CSS_PATH = ROOT / "assets/css/site-navigation-a11y.css"

HERO_PATTERN = re.compile(
    r'<section class="page-title reveal">\s*'
    r'<p class="kicker">Revision 2021</p>\s*'
    r'<h1>(.*?)</h1>\s*'
    r'<p>Semester 1 to Semester 6 subject cards for the 2021 revision\.</p>\s*'
    r'</section>',
    flags=re.I | re.S,
)

pages = sorted(DEPARTMENT_DIR.glob("*.html"))
updated = 0
for page in pages:
    text = page.read_text(encoding="utf-8")
    match = HERO_PATTERN.search(text)
    if not match:
        raise SystemExit(f"Expected department hero was not found in {page}")
    department = match.group(1).strip()
    replacement = f'''<section class="department-context reveal" aria-labelledby="department-title">
      <div class="department-context-copy">
        <p class="kicker">Revision 2021 Department</p>
        <h1 id="department-title">{department}</h1>
      </div>
      <p class="department-context-note">Semester 1–6 subjects</p>
    </section>'''
    text = HERO_PATTERN.sub(replacement, text, count=1)
    text = re.sub(
        r'/assets/css/site-navigation-a11y\.css(?:\?v=[^"\']*)?',
        '/assets/css/site-navigation-a11y.css?v=20260614-compact-department1',
        text,
    )
    page.write_text(text, encoding="utf-8")
    updated += 1

css = CSS_PATH.read_text(encoding="utf-8").rstrip() + "\n"
marker = "/* Compact department identity panel. */"
if marker not in css:
    css += '''
/* Compact department identity panel. */
.department-context{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:1rem;
  width:100%;
  margin:10px 0 18px;
  padding:18px clamp(18px,2vw,28px);
  border:1px solid rgba(148,163,184,.28);
  border-radius:20px;
  background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(239,246,255,.92));
  box-shadow:0 10px 28px rgba(15,35,65,.08);
}
.department-context-copy{min-width:0}
.department-context .kicker{margin:0 0 .35rem;font-size:.68rem;letter-spacing:.12em}
.department-context h1{max-width:none;margin:0;font-size:clamp(1.55rem,2.4vw,2.35rem);line-height:1.05;letter-spacing:-.035em;overflow-wrap:anywhere}
.department-context-note{flex:0 0 auto;margin:0;padding:.58rem .82rem;border:1px solid rgba(2,132,199,.18);border-radius:999px;background:#e0f2fe;color:#075985;font-size:.78rem;font-weight:850;white-space:nowrap}
@media(max-width:700px){.department-context{align-items:flex-start;flex-direction:column;gap:.72rem;margin:8px 0 14px;padding:15px 16px;border-radius:16px}.department-context h1{font-size:clamp(1.42rem,7vw,1.9rem)}.department-context-note{font-size:.72rem}}
@media print{.department-context{box-shadow:none}}
'''
CSS_PATH.write_text(css, encoding="utf-8")

sample = (DEPARTMENT_DIR / "electronics-engineering.html").read_text(encoding="utf-8")
if 'class="page-title reveal"' in sample:
    raise SystemExit("Oversized hero still exists in the sample department page")
if 'class="department-context reveal"' not in sample:
    raise SystemExit("Compact department header was not added")
print(f"Compact department headers applied: {updated}")
