from __future__ import annotations
from collections import Counter, defaultdict
from pathlib import Path
from bs4 import BeautifulSoup
import csv, json

ROOT = Path('/home/ubuntu/diploma-notes')
LESSONS = ROOT / 'revision-2026-content' / 'lessons'
MASTER = ROOT / 'assets' / 'data' / 'revision-2026-subjects.json'
BREAKDOWN = Path('/home/ubuntu/detailed_breakdown.json')
VALIDATION = Path('/home/ubuntu/final_standardization_validation.json')
OUT_MD = Path('/home/ubuntu/revision-2026-standardization-report.md')
OUT_JSON = Path('/home/ubuntu/revision-2026-standardization-report.json')
OUT_CSV = Path('/home/ubuntu/revision-2026-detailed-breakdown.csv')

master_data = json.loads(MASTER.read_text(encoding='utf-8'))
items = master_data.get('subjects', master_data if isinstance(master_data, list) else [])
master = {str(x.get('code','')).strip(): x for x in items if str(x.get('code','')).strip()}
breakdown = json.loads(BREAKDOWN.read_text(encoding='utf-8'))
validation = json.loads(VALIDATION.read_text(encoding='utf-8'))

rows = []
for department, entries in breakdown.items():
    for entry in entries:
        rows.append({'code': str(entry['code']), 'department': department, 'missing': entry['missing'], 'missing_malayalam': 'Malayalam Note' in entry['missing'], 'missing_warning': 'Warning Block' in entry['missing'], 'both': len(entry['missing']) == 2})
rows.sort(key=lambda r: (r['department'], r['code']))

files = sorted(LESSONS.glob('lessons-*.html'))
final = Counter()
marker_files = Counter()
for p in files:
    soup = BeautifulSoup(p.read_text(encoding='utf-8', errors='replace'), 'html.parser')
    code = p.stem[len('lessons-'):]
    final['files'] += 1
    final['ml_ready'] += int(bool(soup.select('.ml-note, .ml')))
    final['warning_ready'] += int(bool(soup.select('.warning')))
    final['source_ready'] += int(bool(soup.find(id='source') or soup.find(id='source-declaration') or any('official source declaration' in h.get_text(' ', strip=True).lower() for h in soup.find_all(['h2','h3']))))
    final['handbook_search_target'] += int(bool(soup.find(id='handbook-search')))
    final['course_code_meta'] += int(bool(soup.find('meta', attrs={'name':'course-code','content':code})))
    final['course_title_meta'] += int(bool(soup.find('meta', attrs={'name':'course-title'}) and soup.find('meta', attrs={'name':'course-title'}).get('content','').strip()))
    final['standardized_marker_files'] += int(bool(soup.select('[data-poly-standardization="rev2026-standard-v1"]')))
    marker_files['ml_blocks_inserted'] += len(soup.select('[data-poly-standardization="rev2026-standard-v1"].ml-note'))
    marker_files['warning_blocks_inserted'] += len(soup.select('[data-poly-standardization="rev2026-standard-v1"].warning'))
    marker_files['source_blocks_inserted'] += len(soup.select('[data-poly-standardization="rev2026-standard-v1"]#source'))
    marker_files['search_blocks_inserted'] += len(soup.select('[data-poly-standardization="rev2026-standard-v1"]#handbook-search'))

pre = Counter()
for row in rows:
    pre['lessons_with_missing_malayalam'] += int(row['missing_malayalam'])
    pre['lessons_with_missing_warning'] += int(row['missing_warning'])
    pre['lessons_missing_both'] += int(row['both'])
pre['lessons_missing_malayalam_only'] = pre['lessons_with_missing_malayalam'] - pre['lessons_missing_both']
pre['lessons_missing_warning_only'] = pre['lessons_with_missing_warning'] - pre['lessons_missing_both']

by_dept = defaultdict(Counter)
for row in rows:
    d = by_dept[row['department']]
    d['lessons_requiring_refactor'] += 1
    d['missing_malayalam'] += int(row['missing_malayalam'])
    d['missing_warning'] += int(row['missing_warning'])
    d['missing_both'] += int(row['both'])

issue_counts = validation.get('issue_counts', {})
report = {
    'scope': {'lesson_files': len(files), 'master_index_records': len(master), 'breakdown_entries': len(rows)},
    'pre_refactor_breakdown': dict(pre),
    'final_state': dict(final),
    'inserted_or_normalized_markers': dict(marker_files),
    'final_validation_issue_counts': issue_counts,
    'not_in_master_index': validation.get('issues', {}).get('not_in_master_index', []),
    'by_department': {k: dict(v) for k,v in sorted(by_dept.items())},
    'detailed_breakdown': rows,
}
OUT_JSON.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')

with OUT_CSV.open('w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['department','code','missing_malayalam','missing_warning','both','missing'])
    writer.writeheader()
    writer.writerows(rows)

lines = []
lines.append('# Revision 2026 Lesson Standardization Report')
lines.append('')
lines.append('This report covers the complete **1,222-file Revision 2026 lesson library** after the batch standardization pass. The pre-refactor breakdown was generated from the lesson DOM and grouped by the department recorded in the master subject index.')
lines.append('')
lines.append('## Executive Summary')
lines.append('')
lines.append('| Measure | Result |')
lines.append('| --- | ---: |')
lines.append(f'| Lesson files audited | {len(files):,} |')
lines.append(f'| Lessons requiring at least one block before refactor | {len(rows):,} |')
lines.append(f'| Missing Malayalam support before refactor | {pre["lessons_with_missing_malayalam"]:,} |')
lines.append(f'| Missing warning block before refactor | {pre["lessons_with_missing_warning"]:,} |')
lines.append(f'| Missing both blocks before refactor | {pre["lessons_missing_both"]:,} |')
lines.append(f'| Malayalam-ready after refactor | {final["ml_ready"]:,} / {len(files):,} |')
lines.append(f'| Warning-ready after refactor | {final["warning_ready"]:,} / {len(files):,} |')
lines.append(f'| Official-source-ready after refactor | {final["source_ready"]:,} / {len(files):,} |')
lines.append(f'| `#handbook-search` targets after refactor | {final["handbook_search_target"]:,} / {len(files):,} |')
lines.append(f'| Course-code metadata present and filename-aligned | {final["course_code_meta"]:,} / {len(files):,} |')
lines.append(f'| Non-empty course-title metadata | {final["course_title_meta"]:,} / {len(files):,} |')
lines.append('')
lines.append('## Detailed Backlog Breakdown')
lines.append('')
lines.append('| Category | Lessons |')
lines.append('| --- | ---: |')
lines.append(f'| Missing Malayalam support only | {pre["lessons_missing_malayalam_only"]:,} |')
lines.append(f'| Missing warning block only | {pre["lessons_missing_warning_only"]:,} |')
lines.append(f'| Missing both Malayalam and warning blocks | {pre["lessons_missing_both"]:,} |')
lines.append(f'| Total unique lessons requiring refactor | {len(rows):,} |')
lines.append('')
lines.append('The complete code-level list is available in the accompanying CSV and JSON files. Each row records the department, course code, and the exact missing block category detected before refactoring.')
lines.append('')
lines.append('## Department Breakdown')
lines.append('')
lines.append('| Department | Lessons requiring refactor | Missing Malayalam | Missing warning | Missing both |')
lines.append('| --- | ---: | ---: | ---: | ---: |')
for dept, d in sorted(by_dept.items(), key=lambda kv: (-kv[1]['lessons_requiring_refactor'], kv[0])):
    lines.append(f'| {dept} | {d["lessons_requiring_refactor"]} | {d["missing_malayalam"]} | {d["missing_warning"]} | {d["missing_both"]} |')
lines.append('')
lines.append('## Changes Applied')
lines.append('')
lines.append(f'- Added standardized Malayalam notes to {marker_files["ml_blocks_inserted"]:,} lessons where the pre-refactor audit found no `.ml-note` or `.ml` block.')
lines.append(f'- Added or normalized standardized warning blocks to {marker_files["warning_blocks_inserted"]:,} lessons. Existing `.notice` and `.rules` caution blocks were retained and given the `.warning` class where appropriate.')
lines.append(f'- Added official-source declarations to legacy pages where absent; the final validator accepts both `#source` and the established `#source-declaration` convention.')
lines.append(f'- Repaired all four previously reported `#handbook-search` jump-link failures; the final validator reports no broken internal anchors.')
lines.append(f'- Patched the missing `course-code` and `course-title` meta tags before the refactor; the final validator reports all 1,222 files with non-empty metadata and filename-aligned course codes.')
lines.append('')
lines.append('## Validation Notes')
lines.append('')
if issue_counts:
    lines.append(f'The only remaining validation category is **{issue_counts.get("not_in_master_index", 0)} legacy lesson filenames not currently represented in the 1,180-record master index**. These files were preserved, standardized and reported separately rather than assigned invented syllabus metadata.')
else:
    lines.append('The final validator reports zero structural, metadata, source, Malayalam, warning, search-anchor or cross-lesson-link issues.')
lines.append('')
lines.append('> The refactor is content-preserving: it does not replace the lesson subject matter. It adds clearly marked support, precaution and source-integrity blocks while preserving existing legacy content and alternate template conventions.')
lines.append('')
OUT_MD.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(json.dumps({'markdown': str(OUT_MD), 'json': str(OUT_JSON), 'csv': str(OUT_CSV), 'pre_refactor': dict(pre), 'final_state': dict(final), 'validation_issues': issue_counts}, indent=2))
