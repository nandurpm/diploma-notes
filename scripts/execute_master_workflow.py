import os
import re
import json
import subprocess
import urllib.request
import urllib.parse
from pathlib import Path
from openai import OpenAI

# Pre-configured OpenAI client
client = OpenAI()

ROOT = Path('/home/ubuntu/diploma-notes')
PDF_REPO = Path('/home/ubuntu/poly-pmna-pdf-files')
REV2021_DIR = ROOT / 'lessons'
REV2026_DIR = ROOT / 'revision-2026-content' / 'lessons'
MASTER_PROMPT_PATH = ROOT / 'docs' / 'poly-pmna-lesson-html-master-prompt.md'

def log(msg):
    print(f"[WORKFLOW] {msg}", flush=True)

def is_placeholder(path):
    if not path.exists(): return True
    try:
        content = path.read_text(encoding='utf-8', errors='ignore')
        if "official title not published" in content or "Detailed analysis of core principles" in content:
            return True
        if len(content) < 5000:
            return True
    except:
        return True
    return False

def get_missing_2021():
    with open(ROOT / 'assets/js/subjects-data.js', 'r') as f:
        content = f.read()
    subjects = []
    matches = re.finditer(r'\{code:"(?P<code>[^"]+)",name:"(?P<name>[^"]+)"', content)
    for m in matches:
        subjects.append(m.groupdict())
    
    missing = []
    seen = set()
    for s in subjects:
        if s['code'] in seen: continue
        seen.add(s['code'])
        path = REV2021_DIR / f"lessons-{s['code']}.html"
        if is_placeholder(path):
            missing.append(s)
    return missing

def get_missing_2026():
    with open(ROOT / 'assets/data/revision-2026-subjects.json', 'r') as f:
        data = json.load(f)
    subjects = data.get('subjects', [])
    missing = []
    for s in subjects:
        code = s['code']
        path = REV2026_DIR / f"lessons-{code}.html"
        if is_placeholder(path):
            missing.append(s)
    return missing

def find_pdf(code, revision):
    # 1. Try local PDF repo
    rev_path = PDF_REPO / 'sitttr' / f"revision-{revision}" / 'syllabus'
    if rev_path.exists():
        for pdf in rev_path.rglob(f"{code}-*.pdf"): return pdf
        for pdf in rev_path.rglob(f"{code}.pdf"): return pdf
    
    # 2. Try SITTTR official site
    url = f"https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course={code}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            if data.startswith(b"%PDF"):
                temp = Path(f"/tmp/{code}.pdf")
                temp.write_bytes(data)
                return temp
            
            # Try to find PDF link in HTML
            html_text = data.decode('utf-8', errors='ignore')
            match = re.search(r'href="([^"]+\.pdf)"', html_text)
            if match:
                pdf_url = urllib.parse.urljoin(url, match.group(1))
                with urllib.request.urlopen(pdf_url, timeout=15) as pdf_resp:
                    pdf_data = pdf_resp.read()
                    if pdf_data.startswith(b"%PDF"):
                        temp = Path(f"/tmp/{code}.pdf")
                        temp.write_bytes(pdf_data)
                        return temp
    except:
        pass
        
    return None

def extract_text(pdf_path):
    try:
        res = subprocess.run(['pdftotext', '-layout', str(pdf_path), '-'], capture_output=True, text=True, timeout=30)
        return res.stdout.strip()
    except Exception as e:
        log(f"Failed to extract text from {pdf_path}: {e}")
    return ""

def generate_lesson(code, name, revision, syllabus_text):
    master_prompt = MASTER_PROMPT_PATH.read_text()
    prompt = f"""
Apply the following MASTER PROMPT to create a professional, syllabus-complete, responsive HTML handbook for:
Course Code: {code}
Course Name: {name}
Revision: {revision}

SYLLABUS TEXT:
{syllabus_text}

MASTER PROMPT:
{master_prompt}

Return ONLY the complete HTML code.
"""
    try:
        log(f"Calling AI for {code}...")
        response = client.chat.completions.create(
            model="gpt-5-mini", # Use mini for speed and reliability in batches
            messages=[
                {"role": "system", "content": "You are a senior curriculum author and web developer. Return only complete HTML code."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_completion_tokens=15000
        )
        if not response or not response.choices:
            log(f"AI Error: Empty response for {code}")
            return None
            
        content = response.choices[0].message.content
        if not content:
            log(f"AI Error: Empty content for {code}")
            return None
            
        content = content.strip()
        if content.startswith('```html'):
            content = content[7:]
        if content.endswith('```'):
            content = content[:-3]
        log(f"AI Success for {code} ({len(content)} chars)")
        return content.strip()
    except Exception as e:
        log(f"AI Exception for {code}: {e}")
    return None

def validate_html(html_code):
    if not html_code or len(html_code) < 5000: return False
    if '<html' not in html_code.lower(): return False
    return True

def run_batch(revision, subjects, limit=5):
    count = 0
    for s in subjects:
        if count >= limit: break
        code = s['code']
        name = s['name']
        log(f"Processing {revision} Course {code}: {name}")
        
        pdf_path = find_pdf(code, revision)
        if not pdf_path:
            log(f"Skipping {code}: PDF not found.")
            continue
        
        text = extract_text(pdf_path)
        if len(text) < 500:
            log(f"Skipping {code}: Text extraction failed or too short.")
            continue
        
        html_code = generate_lesson(code, name, revision, text)
        if validate_html(html_code):
            target_dir = REV2021_DIR if revision == '2021' else REV2026_DIR
            target_path = target_dir / f"lessons-{code}.html"
            target_path.write_text(html_code, encoding='utf-8')
            log(f"Saved {target_path}")
            count += 1
        else:
            log(f"Validation failed for {code} (length: {len(html_code) if html_code else 0})")
            
    return count

def main():
    # 1. Pull latest
    subprocess.run(['git', 'pull', 'origin', 'main'], cwd=ROOT)
    
    # 2. Revision 2021
    missing_2021 = get_missing_2021()
    log(f"Found {len(missing_2021)} missing/placeholder Revision 2021 subjects.")
    count_2021 = run_batch('2021', missing_2021, limit=5)
    
    # 3. Revision 2026
    missing_2026 = get_missing_2026()
    log(f"Found {len(missing_2026)} missing/placeholder Revision 2026 subjects.")
    count_2026 = run_batch('2026', missing_2026, limit=5)
    
    # 4. Push
    if count_2021 + count_2026 > 0:
        subprocess.run(['git', 'add', '.'], cwd=ROOT)
        subprocess.run(['git', 'commit', '-m', f"feat(lessons): add {count_2021} REV2021 and {count_2026} REV2026 lessons"], cwd=ROOT)
        subprocess.run(['git', 'push', 'origin', 'main'], cwd=ROOT)
        log(f"Pushed {count_2021 + count_2026} new lessons.")

if __name__ == "__main__":
    main()
