#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urldefrag
from bs4 import BeautifulSoup
import json, re

ROOT = Path(__file__).resolve().parents[1]
LESSONS = ROOT / 'revision-2026-content' / 'lessons'
MASTER = ROOT / 'assets' / 'data' / 'revision-2026-subjects.json'
REPORT = Path('/home/ubuntu/final_standardization_validation.json')

idx = json.loads(MASTER.read_text(encoding='utf-8'))
items = idx.get('subjects', idx if isinstance(idx, list) else [])
master = {str(x.get('code','')).strip(): x for x in items if str(x.get('code','')).strip()}
files = sorted(LESSONS.glob('lessons-*.html'))
issues = defaultdict(list)
counts = Counter()
by_department = defaultdict(Counter)

for p in files:
    code = p.stem[len('lessons-'):]
    soup = BeautifulSoup(p.read_text(encoding='utf-8', errors='replace'), 'html.parser')
    record = master.get(code)
    dept = record.get('programme','Not in master index') if record else 'Not in master index'
    by_department[dept]['files'] += 1
    counts['files'] += 1

    cm = soup.find('meta', attrs={'name':'course-code'})
    tm = soup.find('meta', attrs={'name':'course-title'})
    if not cm or not cm.get('content','').strip():
        issues['missing_course_code_meta'].append(p.name)
    elif cm.get('content','').strip() != code:
        issues['wrong_course_code_meta'].append({'file':p.name,'value':cm.get('content',''),'expected':code})
    if not tm or not tm.get('content','').strip():
        issues['missing_course_title_meta'].append(p.name)
    if not record:
        issues['not_in_master_index'].append(p.name)

    has_ml = bool(soup.select('.ml-note, .ml'))
    has_warning = bool(soup.select('.warning'))
    source_node = soup.find(id='source') or soup.find(id='source-declaration')
    has_source = bool(source_node) and bool(source_node.find(['h2','h3']))
    if not has_source:
        has_source = any('official source declaration' in h.get_text(' ', strip=True).lower() for h in soup.find_all(['h2','h3']))
    if not has_ml: issues['missing_malayalam_block'].append(p.name)
    if not has_warning: issues['missing_warning_block'].append(p.name)
    if not has_source: issues['missing_source_declaration'].append(p.name)
    by_department[dept]['ml_ok'] += int(has_ml)
    by_department[dept]['warning_ok'] += int(has_warning)
    by_department[dept]['source_ok'] += int(has_source)
    if 'data-poly-standardization="rev2026-standard-v1"' in str(soup): counts['files_with_batch_marker'] += 1

    ids = {x.get('id') for x in soup.find_all(id=True) if x.get('id')}
    for a in soup.find_all('a', href=True):
        href = a.get('href','')
        if href.startswith('#'):
            target = href[1:]
            if target and target not in ids:
                issues['broken_internal_anchors'].append({'file':p.name,'href':href,'text':a.get_text(' ',strip=True)})
        elif href.startswith('lessons-') and '#' in href:
            path_part, frag = urldefrag(href)
            target_path = LESSONS / path_part
            if not target_path.exists():
                issues['broken_cross_lesson_links'].append({'file':p.name,'href':href})

    if soup.find_all(id='handbook-search'):
        counts['search_targets'] += 1
    if soup.find_all('a', href='#handbook-search'):
        counts['search_links'] += len(soup.find_all('a', href='#handbook-search'))

    by_department[dept]['course_code_ok'] += int(cm and cm.get('content','').strip() == code)
    by_department[dept]['course_title_present'] += int(bool(tm and tm.get('content','').strip()))

summary = {
    'file_count': len(files),
    'master_index_count': len(master),
    'counts': dict(counts),
    'issue_counts': {k: len(v) for k,v in issues.items()},
    'by_department': {k: dict(v) for k,v in sorted(by_department.items())},
    'issues': dict(issues),
}
REPORT.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding='utf-8')
print(json.dumps({'file_count': len(files), 'issue_counts': summary['issue_counts'], 'report': str(REPORT)}, indent=2))
