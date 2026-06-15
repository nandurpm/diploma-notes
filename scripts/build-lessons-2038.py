from pathlib import Path
import gzip
import hashlib
import re

root = Path.cwd()

raw_files = [
    'tmp/lessons-2038-hex3/000.part',
    'tmp/lessons-2038-hex3/001.part',
    'tmp/lessons-2038-hex3/002-00.part',
]
encoded_files = [
    'tmp/lessons-2038-enc/00.part',
    'tmp/lessons-2038-enc/01.part',
    'tmp/lessons-2038-enc/02a.part',
    'tmp/lessons-2038-enc/02b.part',
]

raw_hex = ''.join((root / item).read_text(encoding='utf-8').strip() for item in raw_files)
encoded_tail = ''.join((root / item).read_text(encoding='utf-8').strip() for item in encoded_files)

# The transfer tail represents hexadecimal digits using sixteen consecutive letters.
digits = '0123456789abcdef'
letters = ''.join(chr(ord('g') + index) for index in range(16))
decoded_tail = encoded_tail.translate(str.maketrans(letters, digits))
html = gzip.decompress(bytes.fromhex(raw_hex + decoded_tail))

expected_sha = '4be91d6ec3f35e5f328fde7adf42a1bf08deffa2630984c58bf8c749eba5f924'
actual_sha = hashlib.sha256(html).hexdigest()
if actual_sha != expected_sha:
    raise SystemExit(f'Unexpected handbook SHA-256: {actual_sha}')

lesson = root / 'lessons/lessons-2038.html'
lesson.parent.mkdir(exist_ok=True)
lesson.write_bytes(html)

text = html.decode('utf-8')
for token in (
    '<title>Engineering Graphics Using CAD Software 2038 | Complete Lab Handbook</title>',
    'Model Lab Examination',
    'Master Answer Key',
    'downloadable-notes-2038.pdf',
    'Open-Ended Project',
):
    if token not in text:
        raise SystemExit(f'Missing required handbook content: {token}')

browser = root / 'assets/js/subject-browser.js'
source = browser.read_text(encoding='utf-8')
match = re.search(r'const LESSON_CODES = new Set\(\[(.*?)\]\);', source, re.S)
if not match:
    raise SystemExit('LESSON_CODES block not found')
codes = re.findall(r'"([^"]+)"', match.group(1))
for code in ('2002', '2038'):
    if code not in codes:
        codes.append(code)
codes.sort(key=lambda value: (int(re.match(r'\d+', value).group()), value))
rows = []
for index in range(0, len(codes), 8):
    rows.append('    ' + ', '.join(f'"{code}"' for code in codes[index:index + 8]))
replacement = 'const LESSON_CODES = new Set([\n' + ',\n'.join(rows) + '\n  ]);'
browser.write_text(source[:match.start()] + replacement + source[match.end():], encoding='utf-8')

sitemap = root / 'sitemap.xml'
site = sitemap.read_text(encoding='utf-8')
entry = '  <url><loc>https://polypmna.dpdns.org/lessons/lessons-2038.html</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n'
if 'lessons/lessons-2038.html' not in site:
    anchor = '  <url><loc>https://polypmna.dpdns.org/lessons/lessons-2031.html</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n'
    if anchor not in site:
        raise SystemExit('Sitemap insertion anchor not found')
    sitemap.write_text(site.replace(anchor, anchor + entry, 1), encoding='utf-8')

print(f'Built {lesson} ({len(html)} bytes, SHA-256 {actual_sha})')
