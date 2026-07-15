#!/usr/bin/env python3
import html,json,re
from collections import defaultdict
from pathlib import Path

DATA=Path("assets/data/revision-2026-subjects.json")
REGISTRY=Path("assets/data/revision-2026-programmes.json")
OUT=Path("revision-2026")
SITE="https://polypmna.dpdns.org"
IMAGE=SITE+"/assets/media/poly-pmna-study-hub-social-card.png"

def e(v): return html.escape(str(v),quote=True)
def sem(row):
    code=str(row.get("code","")).strip()
    if code and code[0] in "123456": return int(code[0])
    m=re.search(r"\b([1-6])\b",str(row.get("semester","")))
    return int(m.group(1)) if m else 99

def head(title,desc,url):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="{e(desc)}"><title>{e(title)}</title><link rel="canonical" href="{e(url)}"><meta property="og:type" content="website"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{e(url)}"><meta property="og:image" content="{IMAGE}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(title)}"><meta name="twitter:description" content="{e(desc)}"><meta name="twitter:image" content="{IMAGE}"><link rel="stylesheet" href="/assets/css/style.css?v=20260716-rev2026-tables"><link rel="stylesheet" href="/assets/css/animations.css?v=20260716-rev2026-tables"><link rel="stylesheet" href="/assets/css/responsive.css?v=20260716-rev2026-tables"><link rel="stylesheet" href="/assets/css/department-card-art.css?v=20260716-rev2026-tables"><link rel="stylesheet" href="/assets/css/hardening.css?v=20260716-rev2026-tables"><link rel="stylesheet" href="/assets/css/site-navigation-a11y.css?v=20260716-rev2026-tables"><link rel="stylesheet" href="/assets/css/site-brand.css?v=20260716-rev2026-tables"><link rel="stylesheet" href="/assets/css/portal-layout.css?v=20260716-rev2026-tables"><link rel="stylesheet" href="/assets/css/fixed-site-header.css?v=20260716-rev2026-tables"><style>.r26w{{overflow:auto;border:1px solid #dbe4f3;border-radius:16px}}.r26{{width:100%;min-width:720px;border-collapse:collapse;background:#fff}}.r26 th,.r26 td{{padding:12px;border-bottom:1px solid #e5eaf2;text-align:left;vertical-align:top}}.r26 th{{background:#eef4ff}}.r26 td:first-child{{font-weight:800;white-space:nowrap}}.sem{{margin:0 0 28px}}</style></head>'''

def nav():
    return '''<a class="skip-link" href="#main">Skip to main content</a><header class="topbar"><a class="brand" href="/index.html"><span class="brand-symbol">📚</span><strong>POLY PMNA</strong></a><button class="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">Menu</button><nav class="navlinks"><a href="/index.html">Home</a><a href="/about.html">About</a><a href="/revision-2021.html">Revision 2021</a><a class="active" aria-current="page" href="/revision-2026.html">Revision 2026</a><a href="/daily-quiz.html">Mock Exams</a><a href="/ask-poly.html">Ask POLY AI</a><a href="/materials-2015.html">2015 Materials</a><a href="/tools.html">Tools <span class="nav-badge">New</span></a><a href="/contact.html">Help</a></nav></header>'''

def foot():
    return '''<footer class="footer"><p>&copy; <span data-year></span> POLY PMNA.</p><a href="https://nandakumarm.dpdns.org/about.html">Connect to Developer</a><nav class="footer-legal"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/disclaimer.html">Disclaimer</a></nav></footer><script src="/assets/js/main.js" defer></script><script src="/assets/js/site-hardening.js" defer></script><script src="/assets/js/fixed-site-header.js" defer></script>'''

def index(programmes):
    cards="".join(f'<a class="choice-card reveal" href="/revision-2026/{e(p["slug"])}.html"><span>{e(p["officialCode"])}</span><h2>{e(p["name"])}</h2><p>Open Semester 1–6 subject tables.</p></a>' for p in programmes)
    title="Revision 2026 Diploma Departments | POLY PMNA"
    desc="Browse all 38 official SITTTR Kerala Revision 2026 programmes and Semester 1 to Semester 6 subject tables."
    return head(title,desc,SITE+"/revision-2026.html")+f'''<body class="portal-page">{nav()}<main id="main"><nav class="site-breadcrumbs"><ol><li><a href="/">Home</a></li><li>Revision 2026</li></ol></nav><section class="page-title reveal"><p class="kicker">Revision 2026</p><h1>Choose your 2026 department</h1><p>All 38 official programme links are embedded in this HTML.</p></section><section class="section cards two selection-grid">{cards}</section><section class="section notice"><strong>Official source:</strong> <a href="https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&amp;scheme=REV2026">SITTTR Revision 2026</a></section></main>{foot()}</body></html>\n'''

def page(programme,rows):
    blocks=[]
    for n in range(1,7):
        items=[r for r in rows if sem(r)==n]
        trs="".join(f'<tr><td>{e(r.get("code",""))}</td><td>{e(r.get("name",""))}</td><td>{e(r.get("type","Course"))}</td><td><a class="action syllabus" href="{e(r.get("syllabusUrl",""))}" target="_blank" rel="noopener noreferrer">Open Syllabus</a></td></tr>' for r in items)
        if not trs: trs='<tr><td colspan="4">No verified subjects listed.</td></tr>'
        blocks.append(f'<section class="sem"><div class="section-heading inline-heading"><div><p class="kicker">Semester {n}</p><h2>Semester {n} subjects</h2></div><p>{len(items)} subjects</p></div><div class="r26w"><table class="r26"><thead><tr><th>Code</th><th>Subject</th><th>Type</th><th>Official syllabus</th></tr></thead><tbody>{trs}</tbody></table></div></section>')
    name=programme["name"];code=programme["officialCode"];slug=programme["slug"]
    title=f"{name} Revision 2026 Subjects | POLY PMNA"
    desc=f"Official SITTTR Revision 2026 {name} subjects grouped by Semester 1 to Semester 6."
    return head(title,desc,f"{SITE}/revision-2026/{slug}.html")+f'''<body class="portal-page">{nav()}<main id="main"><nav class="site-breadcrumbs"><ol><li><a href="/">Home</a></li><li><a href="/revision-2026.html">Revision 2026</a></li><li>{e(name)}</li></ol></nav><section class="page-title reveal"><p class="kicker">Revision 2026 · {e(code)}</p><h1>{e(name)}</h1><p>{len(rows)} official subject records. All Semester 1–6 tables work without JavaScript.</p></section><section class="section compact">{"".join(blocks)}</section><section class="section notice"><strong>Official programme page:</strong> <a href="{e(programme["officialUrl"])}" target="_blank" rel="noopener noreferrer">SITTTR {e(code)}</a></section></main>{foot()}</body></html>\n'''

def main():
    programmes=json.loads(REGISTRY.read_text(encoding="utf-8"))["programmes"]
    subjects=json.loads(DATA.read_text(encoding="utf-8"))["subjects"]
    if len(programmes)!=38: raise SystemExit("Expected 38 programmes")
    by=defaultdict(list)
    for row in subjects:
        slug=row.get("programmeSlug","")
        if slug:
            fixed=dict(row);fixed["semester"]=f"Semester {sem(row)}";fixed["semesterSource"]="course-code"
            by[slug].append(fixed)
    missing=[p["slug"] for p in programmes if not by[p["slug"]]]
    if missing: raise SystemExit("Empty programme data: "+", ".join(missing))
    OUT.mkdir(exist_ok=True)
    Path("revision-2026.html").write_text(index(programmes),encoding="utf-8")
    counts={}
    for p in programmes:
        rows=sorted(by[p["slug"]],key=lambda r:(sem(r),str(r.get("code","")),str(r.get("name","")).casefold()))
        counts[p["slug"]]=len(rows)
        (OUT/(p["slug"]+".html")).write_text(page(p,rows),encoding="utf-8")
    Path("reports").mkdir(exist_ok=True)
    Path("reports/revision-2026-build-summary.json").write_text(json.dumps({"scheme":"REV2026","programmeCount":38,"subjectCount":len(subjects),"staticPageCount":38,"programmeSubjectCounts":counts},indent=2)+"\n")
    print(f"Built 38 static pages from {len(subjects)} subject records")
if __name__=="__main__": main()
